import { useEffect } from 'react'

const DOMAIN = 'https://kripaconnect.in'
const DEFAULT_IMAGE = `${DOMAIN}/icon-512.png`
const SITE_NAME = 'KripaConnect'

/**
 * Helper to update or create a meta tag
 */
function setMetaTag(attribute, attrValue, content) {
  if (!content) return
  let element = document.querySelector(`meta[${attribute}="${attrValue}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, attrValue)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

/**
 * Helper to update or create canonical link
 */
function setCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

/**
 * Helper to update or create JSON-LD script
 */
function setJsonLd(schemaData) {
  const existingScript = document.getElementById('dynamic-jsonld')
  if (existingScript) {
    existingScript.remove()
  }

  if (schemaData) {
    const script = document.createElement('script')
    script.id = 'dynamic-jsonld'
    script.type = 'application/ld+json'
    script.text = JSON.stringify(schemaData)
    document.head.appendChild(script)
  }
}

/**
 * Centralized SEO component for dynamic on-page SEO, OpenGraph, Twitter, and Schema
 */
export default function SEO({
  title,
  description,
  canonical,
  image,
  type = 'website',
  robots = 'index, follow',
  keywords,
  schema,
}) {
  const fullTitle = title
    ? title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`
    : 'KripaConnect® - A B2B & B2C Platform'

  const canonicalUrl = canonical
    ? canonical.startsWith('http')
      ? canonical
      : `${DOMAIN}${canonical.startsWith('/') ? '' : '/'}${canonical}`
    : DOMAIN

  const imageUrl = image
    ? image.startsWith('http')
      ? image
      : `${DOMAIN}${image.startsWith('/') ? '' : '/'}${image}`
    : DEFAULT_IMAGE

  useEffect(() => {
    // 1. Page Title
    document.title = fullTitle

    // 2. Primary Meta Tags
    setMetaTag('name', 'title', fullTitle)
    if (description) setMetaTag('name', 'description', description)
    if (keywords) setMetaTag('name', 'keywords', keywords)
    setMetaTag('name', 'robots', robots)

    // 3. Canonical Link
    setCanonical(canonicalUrl)

    // 4. Open Graph / Facebook
    setMetaTag('property', 'og:type', type)
    setMetaTag('property', 'og:url', canonicalUrl)
    setMetaTag('property', 'og:title', fullTitle)
    if (description) setMetaTag('property', 'og:description', description)
    setMetaTag('property', 'og:image', imageUrl)
    setMetaTag('property', 'og:site_name', SITE_NAME)

    // 5. Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:url', canonicalUrl)
    setMetaTag('name', 'twitter:title', fullTitle)
    if (description) setMetaTag('name', 'twitter:description', description)
    setMetaTag('name', 'twitter:image', imageUrl)

    // 6. JSON-LD Schema
    setJsonLd(schema)

    return () => {
      // Clean dynamic JSON-LD on unmount
      const script = document.getElementById('dynamic-jsonld')
      if (script) script.remove()
    }
  }, [fullTitle, description, canonicalUrl, imageUrl, type, robots, keywords, schema])

  return null
}
