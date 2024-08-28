/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"

const Bio = () => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      avatar: file(absolutePath: { regex: "/profile-pic.jpg/" }) {
        childImageSharp {
          fixed(width: 50, height: 50, quality: 95) {
            ...GatsbyImageSharpFixed
          }
        }
      }
      site {
        siteMetadata {
          author {
            name
            summary
          }
          social {
            twitter
          }
        }
      }
    }
  `)

  // Set these values by editing "siteMetadata" in gatsby-config.js
  const author = data.site.siteMetadata?.author
  const social = data.site.siteMetadata?.social

  const avatar = data?.avatar?.childImageSharp?.fixed

  return (
      <div className="bio">
        {/* {avatar && (
          <Image
            fixed={avatar}
            alt={author?.name || ``}
            className="bio-avatar"
            imgStyle={{
              borderRadius: `50%`,
            }}
          />
        )} */}
        {author?.name && (
          /* <p>
            Ecrit par <strong>{author.name}</strong> {author?.summary || null}
            {` `}
          < br />
          <p> */
          <p>Vous voulez apprendre ou améliorer vos compétences avec Spring (Core, MVC, Data, Security) et React? <br />
           <a href="https://www.udemy.com/course/developpeur-web-fullstack-avec-spring-et-react" target="_blank">Suivez ma formation sur Udemy</a> où nous apprendrons les fondamentaux et développerons ensemble une application pas à pas!
          </p>
        )}

      </div>
     
  )
}

export default Bio
