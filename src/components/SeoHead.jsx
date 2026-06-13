import * as React from 'react'
import { useLocation } from 'react-router-dom'
import { formatTitle, absoluteUrl, siteConfig } from '@/seo/siteConfig'
import { getSeoForPath } from '@/seo/routeSeo'

function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  if (!href) return
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function upsertJsonLd(id, data) {
  document.querySelectorAll('[id^="aqd-jsonld"]').forEach((el) => el.remove())
  if (!data?.length) return

  data.forEach((schema, index) => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = data.length === 1 ? id : `${id}-${index}`
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)
  })
}

export default function SeoHead() {
  const { pathname } = useLocation()

  React.useEffect(() => {
    const config = getSeoForPath(pathname)
    const title = config.title === siteConfig.defaultTitle
      ? siteConfig.defaultTitle
      : formatTitle(config.title)
    const description = config.description || siteConfig.defaultDescription
    const canonical = absoluteUrl(pathname)
    const image = absoluteUrl(siteConfig.defaultOgImage)
    const robots = config.index ? 'index, follow' : 'noindex, nofollow'

    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', robots)
    upsertLink('canonical', canonical)

    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', siteConfig.name)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', image)

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', image)

    upsertJsonLd('aqd-jsonld', config.jsonLd || [])

    return () => {
      document.querySelectorAll('[id^="aqd-jsonld"]').forEach((el) => el.remove())
    }
  }, [pathname])

  return null
}
