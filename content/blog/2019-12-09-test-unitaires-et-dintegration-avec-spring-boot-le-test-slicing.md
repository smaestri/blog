---
title: 'Tests unitaires et d’intégration avec Spring Boot : le “test slicing”'
author: sylvain
type: post
date: 2019-12-09T11:53:46+00:00
url: /index.php/2019/12/09/test-unitaires-et-dintegration-avec-spring-boot-le-test-slicing/
categories:
  - Test
tags:
  - spring-boot
  - spring-data
  - spring-security
  - spring-web

---
## Intro

Lorsque l'on met en place une application Spring Boot, de nombreuses briques entrent en jeu. Par exemple : la gestion des Contrôleurs REST avec la brique [SPRING-WEB][1]; la gestion de la persistance avec la brique [SPRING-DATA][2], et la base de données sous-jacente ( [MongoDB][3] ici); n'oublions pas l'aspect authentification et autorisation via la brique [SPRING-SECURITY][4]. Et on peut imaginer d'autres vu la taille de l'écosystème SPRING!

> Comment faire en sorte de tester les différentes briques Spring efficacement, en environnement
> mocké (test unitaire) ou non (test d'intégration).


Nous allons donc voir la technique de _test slicing_ au travers de 2 scénarios, afin d'isoler la brique à tester. Puis nous verrons un scénario de test d'intégration où toutes les briques seront actives! 

**Test unitaire brique WEB :** Test de la brique WEB avec [_@WebMvcTest_][5]_._ Mocking de la brique Sécurité et DATA.

**Test unitaire brique DATA :** Test de la brique DATA avec [_@DataMongoTest_][6]. Mocking de la brique WEB et Sécurité. Base locale Mongo en mémoire. Des connaissances de SPRING DATA sont bienvenues, je vous laisse regarder [la doc][7].

**Test d'intégration final** : tout est démocké et lancement réel du serveur via [_@SpringBootTest_][8]. Base locale Mongo en mémoire.

## Présentation de notre cas d'exemple

Voici le schéma de l'application que nous allons mettre en place :<figure class="wp-block-image">

<img src="https://www.effectivecoding.fr/wp-content/uploads/2019/12/springtest.png" alt="" class="wp-image-118" srcset="https://www.effectivecoding.fr/wp-content/uploads/2019/12/springtest.png 589w, https://www.effectivecoding.fr/wp-content/uploads/2019/12/springtest-300x92.png 300w" sizes="(max-width: 589px) 100vw, 589px" /> </figure> 

  * Un utilisateur authentifié et autorisé appelle un contrôleur REST (_/users/123_) afin d'obtenir l'adresse d'un autre utilisateur, dont l'identifiant est passé en paramètre. Ce _endpoint_ REST est sécurisé avec SPRING SECURITY : on doit fournir un login + mot de passe en _Basic Authentication (détail ci-après)._
  * On va utiliser Mongo pour la persistance. Nous souhaitons que l'utilisateur qui effectue la requête en _Basic Authentication_ soit inscrit dans la base Mongo (table UTILISATEUR). Pour cela, nous mettons en place une implémentation de [_UserDetailsService_][9] de Spring Security;
  * On va désactiver la gestion de session et la mise en place du JSESSIONID pour plus de simplicité via _.sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)_

Voici le code de la configuration Spring Security associé au vue des règles ci-dessus :


```java
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private CustomUserDetailsService userService;

    @Override
    protected void configure(HttpSecurity http) throws Exception {

        http
            .httpBasic()
            .and()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .csrf().disable()
            .exceptionHandling()
            .and()
            .authorizeRequests()
            .anyRequest().authenticated();
    }

    @Autowired
    public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(this.userService).passwordEncoder(passwordEncoder());
    }

    @Bean
    public PasswordEncoder passwordEncoder(){
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        return encoder;
    }
```






Nous avons donc 2 collections dans Mongo :

  * _UTILISATEUR (userId, email, password)_ : pour la gestion de l'authentification 

  * _CONTACT (userId, address)_ : stockage des adresses de chaque utilisateur, appelé par contrôleur REST

Passons maintenant dans le vif du sujet,avec l'implémentation de nos trois scénarios de tests.

## Scénario 1 : Test unitaire brique WEB

Dans ce scénario, nous voulons simplement tester notre contrôleur REST, qui fait un simple appel à la base de données Mongo. Voici notre contrôleur REST :

```java
@RestController
public class MyController {

    @Autowired
    private ContactService contactService;

    @RequestMapping(value = "/users/{userId}", method = RequestMethod.GET)
    public String test(@PathVariable("userId") String userId ) throws Exception {
        return contactService.getAdress(userId);
    }
```

Voici comment on teste cela :
```java
@RunWith(SpringRunner.class)
@WebMvcTest(MyController.class)
public class Controller_Only_Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApplicationContext appContext;

    // need to mock this beans, will not be used anyway (we use @WithMockUser below)
    @MockBean
    CustomUserDetailsService service;

    @MockBean
    ContactService contactService;

    @Test
    @WithMockUser // use with mockMvc only
    public void testController() throws Exception {
        // given
        String userId = "123";
        when(contactService.getAdress(anyString())).thenReturn("myaddress");

        // when + then
        mockMvc.perform(get("/users/" + userId)).andExpect(content().string(containsString("myaddress")));

    }
```


**Explications :**

  * On utilise _@WebMvcTest(MyController.class)_ afin d'indiquer à Spring de charger uniquement le contexte WEB;
  * Nous utilisons [_MockMvc_][10] pour effectuer l'appel REST;
  * Sachant que les services SPRING (_@Service_) ne sont pas chargés, il faut les mocker via l'annotation[ _@MockBean_][11]
  * _MockMvc_ va initialiser un contexte de sécurité par défaut du fait que nous ayons déclaré la dépendance SPRING SECURITY. Nous devons donc mocker un utilisateur via _[@WithMockUser][12]_

## Scénario 2 : Test unitaire brique DATA

Dans ce scénario, nous voulons simplement tester notre repository MONGO. Pour cela, nous devons mettre en place une base locale en mémoire grâce [à cette librairie][13]. Voici notre repository à tester :

```java
public interface MongoContactRespository extends MongoRepository<Contact, String> {

    Optional<Contact> findByUserId(String userId);
}
```

Voici notre test unitaire :
```java
@RunWith(SpringRunner.class)
@DataMongoTest
public class DB_Only_Test {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    MongoContactRespository mongoContactRespository;

    @Test
    public void testWithFrenchIsbn() {

        // given
        Contact contact = new Contact();
        contact.setUserId("123");
        contact.setAddress("address1");
        mongoTemplate.save(contact);

        // when + then
        Optional<Contact> address = mongoContactRespository.findByUserId("123");
        assertEquals(address.get().getAddress(), "address1");
    }
}
```

**Explications:**

  * On utilise [_@DataMongoTest_][6] pour notre test; cette annotation va uniquement charger le contexte SPRING DATA.
  * On injecte un [_MongoTemplate_][14] pour initialiser notre jeu de données;
  * On injecte notre repository à tester.

## Scénario 3 : Test d'intégration

Pour ce dernier scénario plus complexe, nous allons mettre en place un vrai test d'intégration qui a toutes les briques de SPRING actives : SECURITY, DATA, WEB. Ceci est rendu possible grâce à l'annotation _@SpringBootTest q_ui va charger TOUT le contexte SPRING, comme en conditions réelles!

Voici notre d'intégration :
```java
@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class Full_With_Server_Test {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate testRestTemplate;

    @Autowired
    private ApplicationContext appContext;

    @Autowired
    private WebApplicationContext webAppContext;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Before
    public void setup() {
        // save user who makes authentication
        Utilisateur user = new Utilisateur();
        user.setEmail("toto");
        BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();
        String p = bCryptPasswordEncoder.encode("tutu");
        user.setPassword(p);
        mongoTemplate.save(user);

        // save contact
        Contact contact = new Contact();
        contact.setAddress("adress2");
        contact.setUserId("456");
        mongoTemplate.save(contact);
    }

    @Test
    public void getUserAdress() {
        String adress = testRestTemplate.withBasicAuth("toto", "tutu").getForObject("http://localhost:" + port + "/users/456", String.class);
        assertEquals(adress, "adress2");
    }
}
```

**Explications:**

  * Afin de démarrer un vrai serveur en conditions réelles il faut déclarer : `@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)` qui va lancer le serveur sur un port aléatoire;
  * **Très important :** Vu que `@SpringBootTest` charge le contexte SPRING par défaut, il ne faut surtout pas charger la vraie base Mongo mais la base en mémoire. Pour cela il y a plusieurs options, mais dans notre cas, j'ai choisi les [profils SPRING](https://www.baeldung.com/spring-profiles). J'ai déclaré un profil *test* afin de ne pas charger la configuration réelle de MONGO, mais utiliser la base en mémoire. Voici comment : `@ActiveProfiles(test)` sur la classe de test, et `@Profile(test)` sur la classe de configuration Mongo;
  * Initialiser nos jeu de données via l'annotation `@Before` *Junit* et un `mongoTemplate`;
  * Appel de notre service REST via un appel réel réseau et le [_TestRestTemplate_][15]. Ce dernier est idéal car il offre une méthode `withBasicAuth` pour passer l'utilisateur à authentifier via SPRING SECURITY.

## Conclusion

Voici un POST riche où nous avons passés en revus de nombreux concepts fondamentaux du testing avec SPRING. Toute remarque ou commentaire est bienvenue! Comme d’habitude l'ensemble du code source est accessible sur [mon github][16]. Cheers!

 [1]: https://spring.io/guides/gs/rest-service/
 [2]: https://spring.io/projects/spring-data
 [3]: https://www.mongodb.com/fr
 [4]: https://spring.io/projects/spring-security
 [5]: https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/autoconfigure/web/servlet/WebMvcTest.html
 [6]: https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/autoconfigure/data/mongo/DataMongoTest.html
 [7]: https://docs.spring.io/spring-data/mongodb/docs/current/reference/html/#reference
 [8]: https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/context/SpringBootTest.html
 [9]: https://www.baeldung.com/spring-security-authentication-with-a-database
 [10]: https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/web/servlet/MockMvc.html
 [11]: https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/mock/mockito/MockBean.html
 [12]: https://docs.spring.io/spring-security/site/docs/4.2.13.RELEASE/apidocs/org/springframework/security/test/context/support/WithMockUser.html
 [13]: https://github.com/flapdoodle-oss/de.flapdoodle.embed.mongo
 [14]: https://docs.spring.io/spring-data/mongodb/docs/current/api/org/springframework/data/mongodb/core/MongoTemplate.html
 [15]: https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/web/client/TestRestTemplate.html
 [16]: https://github.com/smaestri/springtest