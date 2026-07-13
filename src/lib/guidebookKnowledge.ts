import type { GuidebookAmenity, GuidebookSearchHit, SocietyRulesGuidebook } from '../types/db'

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

function scoreMatch(query: string, corpus: string) {
  const q = normalize(query)
  const c = normalize(corpus)
  if (!q || !c) return 0
  if (c.includes(q)) return q.length + 10
  const tokens = q.split(' ').filter((token) => token.length > 2)
  if (!tokens.length) return 0
  return tokens.reduce((sum, token) => (c.includes(token) ? sum + token.length : sum), 0)
}

function amenityCorpus(amenity: GuidebookAmenity) {
  return [
    amenity.name,
    amenity.facility_type.replace(/_/g, ' '),
    amenity.open_time,
    amenity.close_time,
    amenity.operating_days,
    amenity.charges,
    amenity.charge_notes,
    amenity.facility_rules
  ].join(' ')
}

export function formatAmenitySummary(amenity: GuidebookAmenity) {
  const timing = [amenity.open_time, amenity.close_time].filter(Boolean).join(' – ')
  const days = amenity.operating_days ? ` (${amenity.operating_days})` : ''
  const charges = amenity.charges ? ` Charges: ${amenity.charges}.` : ' No charge listed.'
  const notes = amenity.charge_notes ? ` ${amenity.charge_notes}` : ''
  const rules = amenity.facility_rules ? ` Rules: ${amenity.facility_rules}` : ''
  return `${amenity.name}: ${timing}${days}.${charges}${notes}${rules}`.trim()
}

/** Flatten the guidebook into plain text for WhatsApp / n8n knowledge retrieval. */
export function exportGuidebookAsKnowledgeText(guidebook: SocietyRulesGuidebook, societyName?: string) {
  const lines: string[] = []
  if (societyName) lines.push(`Society: ${societyName}`, '')

  if (guidebook.security_rules.trim()) {
    lines.push('SECURITY & ACCESS RULES', guidebook.security_rules.trim(), '')
  }
  if (guidebook.community_rules.trim()) {
    lines.push('COMMUNITY RULES & REGULATIONS', guidebook.community_rules.trim(), '')
  }
  if (guidebook.visitor_vehicle_policy.trim()) {
    lines.push('VISITOR & VEHICLE POLICY', guidebook.visitor_vehicle_policy.trim(), '')
  }

  if (guidebook.amenities.length) {
    lines.push('AMENITIES & FACILITIES')
    for (const amenity of [...guidebook.amenities].sort((a, b) => a.sort_order - b.sort_order)) {
      lines.push(`- ${formatAmenitySummary(amenity)}`)
    }
    lines.push('')
  }

  if (guidebook.custom_sections.length) {
    for (const section of [...guidebook.custom_sections].sort((a, b) => a.sort_order - b.sort_order)) {
      lines.push(section.title.toUpperCase(), section.body.trim(), '')
    }
  }

  return lines.join('\n').trim()
}

/** Keyword search across guidebook sections — used by WhatsApp automation inquiry routing. */
export function searchGuidebookKnowledge(
  guidebook: SocietyRulesGuidebook,
  query: string,
  limit = 5
): GuidebookSearchHit[] {
  const hits: GuidebookSearchHit[] = []
  const q = query.trim()
  if (!q) return hits

  const push = (section: string, title: string, body: string) => {
    const score = scoreMatch(q, `${title} ${body}`)
    if (score <= 0) return
    hits.push({
      section,
      title,
      excerpt: body.slice(0, 280) + (body.length > 280 ? '…' : ''),
      score
    })
  }

  if (guidebook.security_rules.trim()) {
    push('Security', 'Security & Access Rules', guidebook.security_rules)
  }
  if (guidebook.community_rules.trim()) {
    push('Community', 'Community Rules', guidebook.community_rules)
  }
  if (guidebook.visitor_vehicle_policy.trim()) {
    push('Visitors', 'Visitor & Vehicle Policy', guidebook.visitor_vehicle_policy)
  }

  for (const amenity of guidebook.amenities) {
    const summary = formatAmenitySummary(amenity)
    push('Amenity', amenity.name, summary)
  }

  for (const section of guidebook.custom_sections) {
    push('Custom', section.title, section.body)
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

export function composeWhatsAppGuidebookReply(hits: GuidebookSearchHit[], societyName?: string) {
  if (!hits.length) {
    return societyName
      ? `We could not find a matching rule in the ${societyName} guidebook. Please contact the management office or raise a helpdesk ticket.`
      : 'We could not find a matching rule in the society guidebook. Please contact the management office.'
  }

  const top = hits[0]
  const prefix = societyName ? `${societyName} — ` : ''
  const extras =
    hits.length > 1
      ? `\n\nRelated: ${hits
          .slice(1, 3)
          .map((hit) => hit.title)
          .join(', ')}`
      : ''
  return `${prefix}${top.title}\n${top.excerpt}${extras}`
}
