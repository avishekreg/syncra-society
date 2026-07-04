import React from 'react'
import LegalPageLayout, {
  LEGAL_BILLING_EMAIL,
  LEGAL_ENTITY,
  LEGAL_PLATFORM,
  LEGAL_PRIVACY_EMAIL,
  LegalList,
  LegalParagraph,
  LegalSection
} from '../../components/legal/LegalPageLayout'

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <LegalSection title="1. Introduction">
        <LegalParagraph>
          This Privacy Policy explains how <strong>{LEGAL_ENTITY}</strong> (&quot;Syncra&quot;, &quot;we&quot;,
          &quot;us&quot;, or &quot;our&quot;) collects, uses, stores, shares, and protects personal data when you access
          or use the <strong>{LEGAL_PLATFORM}</strong> platform (&quot;Platform&quot;).
        </LegalParagraph>
        <LegalParagraph>
          Syncra acts as a <strong>Data Fiduciary</strong> under the Digital Personal Data Protection Act, 2023
          (&quot;DPDP Act&quot;) for personal data processed to operate the Platform, bill Societies, secure accounts,
          and deliver contracted services. Where a housing society or residents&apos; welfare association
          (&quot;Society&quot;) uploads resident records, configures messaging, or determines purposes of processing
          within its workspace, the Society may also act as a Data Fiduciary or Data Processor (as applicable) toward its
          members, and this Policy describes Syncra&apos;s role in that ecosystem.
        </LegalParagraph>
        <LegalParagraph>
          By using the Platform, you acknowledge that you have read this Privacy Policy. If you do not agree, please
          discontinue use and contact us at{' '}
          <a href={`mailto:${LEGAL_PRIVACY_EMAIL}`} className="font-medium text-syncra-blue hover:underline">
            {LEGAL_PRIVACY_EMAIL}
          </a>
          .
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="2. Scope">
        <LegalParagraph>This Policy applies to:</LegalParagraph>
        <LegalList
          items={[
            'Society Administrators, committee members, and authorized staff who register or manage a Society account.',
            'Residents, owners, tenants, and authorized users whose profiles are created on the Platform.',
            'Gatekeepers, security personnel, and vendors whose data is entered by Societies.',
            'Visitors to our public website and persons who contact us for sales or support.',
            'Personal data processed through dashboard features, APIs, mobile-responsive web interfaces, and integrated messaging channels.'
          ]}
        />
        <LegalParagraph>
          This Policy does not apply to third-party websites or services linked from the Platform, which are governed by
          their own privacy statements.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="data-collection" title="3. Categories of Personal Data We Process">
        <LegalParagraph>
          Depending on your role and Society configuration, we may process the following categories of personal data:
        </LegalParagraph>
        <LegalList
          items={[
            <>
              <strong>Identity and contact data:</strong> full name, email address, mobile number, flat or unit number,
              building or block identifier, society membership details, and role (resident, admin, guard, etc.).
            </>,
            <>
              <strong>Society and property data:</strong> society name, address, registration identifiers, flat inventory,
              ownership or tenancy status, maintenance identifiers, and billing configuration.
            </>,
            <>
              <strong>Account and authentication data:</strong> login credentials (stored in hashed form), session
              tokens, email verification status, and audit logs of sign-in activity.
            </>,
            <>
              <strong>Helpdesk and community data:</strong> complaint and suggestion titles, descriptions, categories,
              urgency levels, attachments, ticket status, asset audit records, and maintenance lifecycle notes.
            </>,
            <>
              <strong>Financial and ledger data:</strong> payment references, transaction metadata, outstanding balances,
              defaulter flags, and reconciliation records where Societies use financial modules (Syncra does not receive
              complete bank account credentials).
            </>,
            <>
              <strong>Gatekeeper and visitor data:</strong> visitor names, vehicle details, entry and exit timestamps,
              approval records, and guard notes.
            </>,
            <>
              <strong>Communications data:</strong> notices published by Societies, survey responses, election ballots
              (where encrypted election modules are enabled), and governance scores.
            </>,
            <>
              <strong>WhatsApp and telephony data:</strong> inbound and outbound message content, message delivery
              status, timestamps, template identifiers, opt-in/opt-out records, voice recordings submitted for
              helpdesk transcription, and associated metadata processed through Twilio and related messaging
              infrastructure.
            </>,
            <>
              <strong>Technical and usage data:</strong> IP address, browser type, device identifiers, pages viewed,
              feature usage, error logs, and security event data.
            </>,
            <>
              <strong>Billing data:</strong> invoicing contact details, GST information, payment transaction IDs, and
              subscription history for Society accounts.
            </>
          ]}
        />
        <LegalParagraph>
          Societies are responsible for ensuring they have a lawful basis to upload resident contact details and to
          enable messaging features. Syncra processes such data on documented instructions from the Society and to
          perform the Service.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="4. Sources of Personal Data">
        <LegalList
          items={[
            'Directly from you when you register, submit tickets, respond to surveys, or contact support.',
            'From Society Administrators who create or import resident directories and configure integrations.',
            'From integrated services such as Twilio (delivery receipts, message payloads) and Razorpay (payment confirmations).',
            'Automatically through cookies, logs, and similar technologies when you use the Platform.'
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Purposes and Legal Basis for Processing">
        <LegalParagraph>We process personal data for the following purposes:</LegalParagraph>
        <LegalList
          items={[
            'Providing, operating, maintaining, and improving the Platform and its modules.',
            'Authenticating users, enforcing role-based access, and protecting account security.',
            'Routing complaints, suggestions, notices, visitor approvals, and other Society workflows.',
            'Sending transactional and Society-authorized communications via email, WhatsApp, SMS, or voice through Twilio.',
            'Processing subscription payments, generating invoices, and managing billing relationships with Societies.',
            'Generating AI-assisted transcriptions, categorizations, or urgency assessments where enabled.',
            'Complying with legal obligations, responding to lawful requests, and establishing or defending legal claims.',
            'Detecting fraud, abuse, and security incidents.',
            'Producing aggregated, anonymized analytics to improve product performance (without identifying individuals).'
          ]}
        />
        <LegalParagraph>
          Under the DPDP Act, processing is based on one or more of: consent (where required), performance of a contract
          with the Society or user, compliance with law, and legitimate uses permitted under the Act. Residents may
          receive Society communications based on the Society&apos;s lawful basis; questions about society-specific
          processing should first be directed to the relevant Society Administrator.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="6. WhatsApp and Twilio Messaging">
        <LegalParagraph>
          Where a Society enables WhatsApp Automation or related channels, message content and recipient phone numbers
          are transmitted to and processed by <strong>Twilio Inc.</strong> and its subprocessors in accordance with
          Twilio&apos;s privacy and security practices. This includes inbound messages from residents and outbound
          notices, alerts, and helpdesk notifications initiated through the Platform.
        </LegalParagraph>
        <LegalParagraph>
          Societies must obtain and document valid opt-in from residents before sending promotional or non-essential
          WhatsApp messages and must honour opt-out requests. Syncra logs message metadata for delivery troubleshooting,
          billing of messaging add-ons, and abuse prevention.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="third-party" title="7. Third-Party Processors and Service Providers">
        <LegalParagraph>
          We share personal data with trusted third parties who process data on our behalf under contractual safeguards,
          including:
        </LegalParagraph>
        <LegalList
          items={[
            <>
              <strong>Supabase</strong> — primary database, authentication, and storage infrastructure for Platform
              data hosted in secure cloud environments.
            </>,
            <>
              <strong>Twilio</strong> — WhatsApp Business API, SMS, and voice messaging infrastructure for inbound and
              outbound communications.
            </>,
            <>
              <strong>Razorpay</strong> — payment gateway services for Society subscription and activation fee
              processing.
            </>,
            <>
              <strong>Vercel / cloud hosting providers</strong> — application hosting, content delivery, and serverless
              API execution.
            </>,
            <>
              <strong>Email and automation providers</strong> — transactional email and workflow automation where
              configured (including n8n or similar integration endpoints initiated by Society events).
            </>,
            'Professional advisers, auditors, and insurers where reasonably necessary and subject to confidentiality obligations.'
          ]}
        />
        <LegalParagraph>
          We require processors to implement appropriate technical and organizational measures and to process personal
          data only on our documented instructions, except where independent legal obligations apply.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="8. Sharing with Society Administrators and Other Users">
        <LegalParagraph>
          Data you submit within a Society workspace is visible to authorized Society Administrators and, where
          configured, to other residents according to role permissions (for example, published notices, election
          participation, or helpdesk status visible to the submitting resident). Societies control administrative access
          and are responsible for internal data sharing practices.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="data-security" title="9. Data Security">
        <LegalParagraph>
          Given the sensitive nature of resident identities, contact details, and community records, Syncra implements
          administrative, technical, and organizational safeguards designed to protect personal data, including:
        </LegalParagraph>
        <LegalList
          items={[
            'Encryption in transit using industry-standard TLS for data transmitted between your browser and our servers.',
            'Role-based access controls, society-scoped data isolation, and authenticated API access.',
            'Hashed storage of credentials and restricted access to production systems on a need-to-know basis.',
            'Logging and monitoring of security-relevant events.',
            'Vendor due diligence for subprocessors such as Supabase and Twilio.',
            'Incident response procedures to assess and notify affected parties of personal data breaches where required by law.'
          ]}
        />
        <LegalParagraph>
          No method of transmission or storage is completely secure. You are responsible for safeguarding your account
          credentials and promptly reporting suspected unauthorized access to {LEGAL_PRIVACY_EMAIL}.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="10. Data Retention">
        <LegalParagraph>
          We retain personal data for as long as necessary to provide the Service, fulfil the purposes described in this
          Policy, comply with legal obligations, resolve disputes, and enforce agreements. Typical retention periods
          include:
        </LegalParagraph>
        <LegalList
          items={[
            'Active Society account data — retained for the duration of the subscription and a reasonable export window thereafter.',
            'Helpdesk tickets and audit logs — retained according to Society configuration and legal requirements, generally up to seven (7) years where financial or dispute relevance exists.',
            'Messaging logs — retained for operational, billing, and compliance needs, then deleted or anonymized.',
            'Billing and tax records — retained as required under Indian tax and commercial laws.'
          ]}
        />
        <LegalParagraph>
          Upon account termination, Syncra may delete or anonymize personal data after applicable notice periods, except
          where retention is legally required or necessary for legitimate business purposes.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="11. Cross-Border Processing">
        <LegalParagraph>
          Some subprocessors may process or store data on servers located outside India. Where personal data is
          transferred internationally, Syncra takes steps consistent with applicable law, including contractual
          protections and reliance on permitted transfer mechanisms under the DPDP Act and related rules.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="rights" title="12. Rights of Data Principals">
        <LegalParagraph>
          Subject to the DPDP Act and applicable exceptions, Data Principals may have the right to:
        </LegalParagraph>
        <LegalList
          items={[
            'Obtain information about personal data processed and sharing with third parties.',
            'Request correction of inaccurate or incomplete personal data.',
            'Request erasure of personal data where retention is no longer necessary and no legal exception applies.',
            'Withdraw consent for processing that is based on consent, without affecting prior lawful processing.',
            'Nominate another individual to exercise rights in the event of death or incapacity.',
            'Grievance redressal through our Grievance Officer (see Section 14).'
          ]}
        />
        <LegalParagraph>
          To exercise your rights, email{' '}
          <a href={`mailto:${LEGAL_PRIVACY_EMAIL}`} className="font-medium text-syncra-blue hover:underline">
            {LEGAL_PRIVACY_EMAIL}
          </a>{' '}
          with sufficient detail to verify your identity and specify your request. We will respond within timelines
          prescribed under applicable law. Residents may also contact their Society Administrator where the Society is
          the primary decision-maker for certain processing activities.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="13. Children&apos;s Data">
        <LegalParagraph>
          The Platform is not directed at children under eighteen (18) years of age. Societies must not knowingly
          register minors as independent account holders without appropriate parental or guardian authorization and
          lawful basis. If we learn that personal data of a child has been collected in violation of applicable law, we
          will take steps to delete such data.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="grievance" title="14. Grievance Officer">
        <LegalParagraph>
          In accordance with the DPDP Act and Information Technology (Intermediary Guidelines and Digital Media Ethics
          Code) Rules, 2021, as applicable, Syncra has designated a Grievance Officer for privacy-related complaints:
        </LegalParagraph>
        <LegalList
          items={[
            <>
              <strong>Grievance Officer:</strong> Privacy & Compliance Desk, {LEGAL_ENTITY}
            </>,
            <>
              <strong>Email:</strong>{' '}
              <a href={`mailto:${LEGAL_PRIVACY_EMAIL}`} className="font-medium text-syncra-blue hover:underline">
                {LEGAL_PRIVACY_EMAIL}
              </a>
            </>,
            <>
              <strong>Response timeline:</strong> We acknowledge grievances within seventy-two (72) hours and endeavour
              to resolve them within one (1) month, or within such period as mandated under applicable law.
            </>
          ]}
        />
      </LegalSection>

      <LegalSection title="15. Cookies and Similar Technologies">
        <LegalParagraph>
          We use essential cookies and local storage to maintain sessions, remember preferences, and secure the
          Platform. We do not use advertising cookies or sell personal data to data brokers. You may control non-essential
          cookies through browser settings; disabling essential cookies may impair Platform functionality.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="16. Changes to This Policy">
        <LegalParagraph>
          We may update this Privacy Policy to reflect changes in law, technology, or our practices. Material updates
          will be posted on this page with a revised effective date and, where appropriate, notified to Society
          Administrators. Continued use after the effective date constitutes acknowledgment of the updated Policy.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="17. Contact">
        <LegalParagraph>
          Privacy enquiries:{' '}
          <a href={`mailto:${LEGAL_PRIVACY_EMAIL}`} className="font-medium text-syncra-blue hover:underline">
            {LEGAL_PRIVACY_EMAIL}
          </a>
          <br />
          Billing enquiries:{' '}
          <a href={`mailto:${LEGAL_BILLING_EMAIL}`} className="font-medium text-syncra-blue hover:underline">
            {LEGAL_BILLING_EMAIL}
          </a>
        </LegalParagraph>
      </LegalSection>
    </LegalPageLayout>
  )
}
