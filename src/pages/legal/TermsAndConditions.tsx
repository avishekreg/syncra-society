import React from 'react'
import LegalPageLayout, {
  LEGAL_ENTITY,
  LEGAL_PLATFORM,
  LEGAL_CONTACT_EMAIL,
  LegalList,
  LegalParagraph,
  LegalSection
} from '../../components/legal/LegalPageLayout'

export default function TermsAndConditions() {
  return (
    <LegalPageLayout title="Terms & Conditions">
      <LegalSection title="1. Agreement to Terms">
        <LegalParagraph>
          These Terms & Conditions (&quot;Terms&quot;) constitute a legally binding agreement between{' '}
          <strong>{LEGAL_ENTITY}</strong> (&quot;Syncra&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) and
          the housing society, residents&apos; welfare association, management committee, authorized office-bearer, or
          individual user (&quot;you&quot;, &quot;Customer&quot;, &quot;Society&quot;, or &quot;User&quot;) who accesses
          or uses the <strong>{LEGAL_PLATFORM}</strong> software-as-a-service platform (&quot;Platform&quot;,
          &quot;Service&quot;).
        </LegalParagraph>
        <LegalParagraph>
          By creating an account, completing society onboarding, subscribing to a paid plan, or otherwise using the
          Platform, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy
          Policy. If you do not agree, you must not access or use the Platform.
        </LegalParagraph>
        <LegalParagraph>
          Where a Society registers on behalf of its members, the person accepting these Terms represents and warrants
          that they are duly authorized by the Society&apos;s governing body to bind the Society to this agreement.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="2. Definitions">
        <LegalList
          items={[
            <>
              <strong>Society</strong> means a housing society, apartment owners&apos; association, cooperative housing
              society, gated community management body, or similar residential community entity onboarded to the Platform.
            </>,
            <>
              <strong>Society Administrator</strong> means an RWA office-bearer, president, secretary, treasurer,
              committee member, or other person granted administrative access by the Society.
            </>,
            <>
              <strong>Resident</strong> means an owner, occupant, or authorized family member whose profile is
              created or managed through the Platform at the direction of the Society.
            </>,
            <>
              <strong>Subscription</strong> means the recurring or one-time fee-based access plan selected by a Society,
              including base platform tiers and optional add-on modules.
            </>,
            <>
              <strong>User Content</strong> means complaints, suggestions, notices, ledger entries, visitor logs,
              messages, attachments, and any other data submitted to or transmitted through the Platform.
            </>
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Description of Service">
        <LegalParagraph>
          {LEGAL_PLATFORM} is a cloud-hosted B2B SaaS platform that enables housing societies and apartment complexes to
          manage community administration, including but not limited to: complaint and suggestion ticketing (Smart
          Helpdesk), notice boards, ledgers and financial transparency modules, contract tracking, visitor and gatekeeper
          logs, surveys, gallery management, elections, rewards and governance scoring, and optional automated messaging
          through WhatsApp and related telephony integrations.
        </LegalParagraph>
        <LegalParagraph>
          Syncra provides software tools and infrastructure only. We do not manage the internal affairs of any Society,
          adjudicate disputes between residents, enforce society bye-laws, collect maintenance charges on behalf of a
          Society (except where explicitly enabled through integrated payment features at the Society&apos;s election),
          or act as a property manager, builder, developer, or legal advisor.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="4. Eligibility and Account Registration">
        <LegalParagraph>
          The Platform is intended for use by Societies located in India and their authorized representatives and
          residents. You must be at least eighteen (18) years of age and legally competent to contract under the Indian
          Contract Act, 1872.
        </LegalParagraph>
        <LegalParagraph>
          Society Administrators must provide accurate registration information, including society name, address, flat
          inventory, and authorized contact details. You are responsible for maintaining the confidentiality of login
          credentials and for all activity occurring under your account. You must notify Syncra immediately at{' '}
          {LEGAL_CONTACT_EMAIL} upon becoming aware of unauthorized access.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="acceptable-use" title="5. Acceptable Use Policy">
        <LegalParagraph>
          You agree to use the Platform only for lawful community administration purposes consistent with applicable
          Indian laws, society bye-laws, and these Terms. Without limiting the foregoing, you shall not:
        </LegalParagraph>
        <LegalList
          items={[
            'Submit false, fraudulent, defamatory, harassing, threatening, obscene, or malicious complaints, suggestions, notices, or messages through the Platform.',
            'Use the Platform to spam residents, broadcast unsolicited commercial messages, or send bulk communications outside permitted notice and automation workflows.',
            'File complaints or tickets that relate to illegal activity, incitement to violence, discrimination prohibited by law, or content that violates any person\'s intellectual property or privacy rights.',
            'Impersonate another resident, office-bearer, guard, vendor, or Syncra personnel.',
            'Upload malware, attempt unauthorized access, scrape or reverse engineer the Platform, or interfere with Service availability or security.',
            'Use WhatsApp, SMS, voice, or other messaging channels enabled through the Platform to contact individuals who have not consented to receive such communications, or in violation of Telecom Regulatory Authority of India (TRAI) regulations, WhatsApp Business Policy, or Twilio\'s acceptable use requirements.',
            'Process personal data through the Platform without a lawful basis and without providing residents appropriate notice as required under the Digital Personal Data Protection Act, 2023 ("DPDP Act") and other applicable law.',
            'Use the Platform in any manner that could expose Syncra to regulatory penalty, civil liability, or reputational harm.'
          ]}
        />
        <LegalParagraph>
          Societies are solely responsible for moderating User Content submitted by their residents and for taking
          appropriate action under their internal governance processes. Syncra may, but is not obligated to, review User
          Content and may suspend or remove content or accounts that violate this Acceptable Use Policy.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="6. Society Administrator Responsibilities">
        <LegalParagraph>
          Each Society Administrator acknowledges that they act as the primary operational controller of resident data
          within their Society&apos;s workspace. Societies must:
        </LegalParagraph>
        <LegalList
          items={[
            'Ensure that only authorized persons receive administrative privileges.',
            'Provide residents with accurate information about how their data will be used through the Platform.',
            'Obtain valid consent or other lawful basis before enabling WhatsApp or other outbound messaging to residents.',
            'Respond to resident grievances relating to society-managed data in accordance with applicable law and society policies.',
            'Maintain accurate flat ownership, tenancy, and contact records uploaded to the Platform.'
          ]}
        />
      </LegalSection>

      <LegalSection id="subscription" title="7. Subscription Terms, Billing, and Payment">
        <LegalParagraph>
          Access to certain features requires payment of subscription fees, one-time activation fees, and/or add-on
          module charges as displayed on the Platform or in a written order form or invoice issued by Syncra. All fees are
          quoted in Indian Rupees (INR) unless otherwise stated and are exclusive of applicable taxes, including GST.
        </LegalParagraph>
        <LegalParagraph>
          Subscriptions are billed in advance for the selected billing cycle (monthly, quarterly, or annual, as
          applicable). Payment may be processed through Razorpay or other authorized payment gateways. Failure to pay
          invoiced amounts by the due date constitutes a material breach of these Terms.
        </LegalParagraph>
        <LegalParagraph>
          Syncra may revise pricing for renewal periods upon reasonable prior notice. Continued use after the effective
          date of a price change constitutes acceptance of the revised fees for subsequent billing cycles.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="termination" title="8. Account Suspension and Termination">
        <LegalParagraph>
          Syncra may suspend or terminate a Society&apos;s access to the Platform, in whole or in part, immediately and
          without refund if:
        </LegalParagraph>
        <LegalList
          items={[
            'Subscription, activation, or add-on fees remain unpaid beyond the grace period specified on the invoice or within seven (7) days of written notice, whichever is longer.',
            'The Society or any User materially breaches these Terms, including the Acceptable Use Policy.',
            'Continued provision of the Service would violate law, court order, or third-party platform policy (including Twilio or Meta/WhatsApp requirements).',
            'Syncra reasonably believes the account is compromised or used for fraud or abuse.'
          ]}
        />
        <LegalParagraph>
          Upon suspension for non-payment, resident-facing features, automated messaging, and administrative dashboards
          may be disabled until outstanding amounts are settled. Upon termination, Syncra may delete or anonymize Society
          data after a retention period consistent with our Privacy Policy and applicable law, except where retention is
          required for legal, tax, audit, or dispute-resolution purposes.
        </LegalParagraph>
        <LegalParagraph>
          A Society may cancel its Subscription in accordance with the Refund & Cancellation Policy. Cancellation does
          not relieve the Society of payment obligations accrued before the effective cancellation date.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="9. Intellectual Property">
        <LegalParagraph>
          Syncra and its licensors retain all right, title, and interest in the Platform, including software, designs,
          trademarks, documentation, and aggregated anonymized analytics. These Terms do not transfer any intellectual
          property rights to you.
        </LegalParagraph>
        <LegalParagraph>
          You retain ownership of User Content you submit. You grant Syncra a non-exclusive, worldwide, royalty-free
          license to host, store, reproduce, process, and transmit User Content solely to provide, maintain, secure, and
          improve the Service and as otherwise described in the Privacy Policy.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="liability" title="10. Disclaimers and Limitation of Liability">
        <LegalParagraph>
          THE PLATFORM IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS. TO THE MAXIMUM EXTENT
          PERMITTED BY APPLICABLE LAW, SYNCRA DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY, OR
          OTHERWISE, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND
          ACCURACY OF DATA OUTPUTS.
        </LegalParagraph>
        <LegalParagraph>
          Syncra is a software provider only. We are not a party to disputes between residents, between residents and
          Societies, between Societies and vendors, or between Societies and regulatory authorities. We do not guarantee
          the accuracy of complaints, ledger entries, election results, AI-generated transcriptions, urgency
          classifications, or any User Content. Societies remain solely responsible for decisions taken on the basis of
          Platform data.
        </LegalParagraph>
        <LegalParagraph>
          To the fullest extent permitted by law, Syncra shall not be liable for any indirect, incidental, special,
          consequential, exemplary, or punitive damages, or for loss of profits, goodwill, data, or business
          interruption, arising out of or related to the Service, even if advised of the possibility of such damages.
        </LegalParagraph>
        <LegalParagraph>
          Syncra&apos;s aggregate liability for all claims arising out of or relating to these Terms or the Service shall
          not exceed the total subscription fees actually paid by the Society to Syncra in the twelve (12) months
          immediately preceding the event giving rise to the claim.
        </LegalParagraph>
        <LegalParagraph>
          Nothing in these Terms limits liability that cannot be limited under applicable law, including liability for
          fraud or wilful misconduct.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="11. Indemnification">
        <LegalParagraph>
          You agree to indemnify, defend, and hold harmless Syncra, its directors, officers, employees, and contractors
          from and against any claims, losses, damages, liabilities, penalties, and expenses (including reasonable legal
          fees) arising out of or related to: (a) your use of the Platform; (b) User Content submitted by you or under
          your account; (c) your violation of these Terms or applicable law; (d) disputes between Society members or
          between the Society and third parties; or (e) messaging sent through integrations enabled at your direction
          without proper consent.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="12. Third-Party Services">
        <LegalParagraph>
          The Platform integrates with third-party services including Supabase (database and authentication
          infrastructure), Twilio (WhatsApp, SMS, and voice messaging), Razorpay (payments), cloud hosting providers,
          and optional AI transcription or automation services. Your use of those features may be subject to additional
          third-party terms. Syncra is not responsible for outages, policy changes, or acts of third-party providers
          beyond our reasonable control.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="13. Confidentiality">
        <LegalParagraph>
          Each party may receive confidential information of the other in connection with the Service. The receiving
          party shall use such information only to perform under these Terms and shall protect it with reasonable care.
          This obligation does not apply to information that is publicly available, independently developed, or lawfully
          obtained from a third party without restriction.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="14. Governing Law and Dispute Resolution">
        <LegalParagraph>
          These Terms are governed by the laws of India. Subject to applicable mandatory consumer protection or data
          protection provisions, the courts at Bengaluru, Karnataka shall have exclusive jurisdiction over disputes
          arising from or relating to these Terms or the Service.
        </LegalParagraph>
        <LegalParagraph>
          Before initiating formal proceedings, the parties shall attempt in good faith to resolve disputes through
          written notice to {LEGAL_CONTACT_EMAIL} and a cure period of thirty (30) days.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="15. Changes to Terms">
        <LegalParagraph>
          Syncra may update these Terms from time to time. Material changes will be notified through the Platform, by
          email to registered Society Administrators, or by updating the effective date on this page. Continued use of
          the Platform after the effective date constitutes acceptance of the revised Terms.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="16. Contact">
        <LegalParagraph>
          For questions regarding these Terms, contact {LEGAL_ENTITY} at{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-medium text-syncra-blue hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </LegalParagraph>
      </LegalSection>
    </LegalPageLayout>
  )
}
