import React from 'react'
import { Link } from 'react-router-dom'
import LegalPageLayout, {
  LEGAL_BILLING_EMAIL,
  LEGAL_CONTACT_EMAIL,
  LEGAL_ENTITY,
  LEGAL_PLATFORM,
  LegalList,
  LegalParagraph,
  LegalSection
} from '../../components/legal/LegalPageLayout'

export default function RefundPolicy() {
  return (
    <LegalPageLayout title="Refund & Cancellation Policy">
      <LegalSection title="1. Purpose and Scope">
        <LegalParagraph>
          This Refund & Cancellation Policy (&quot;Policy&quot;) governs subscription fees, one-time activation fees,
          add-on module charges, and related payments made by housing societies, residents&apos; welfare associations,
          and authorized management bodies (&quot;Society&quot;, &quot;Customer&quot;, or &quot;you&quot;) to{' '}
          <strong>{LEGAL_ENTITY}</strong> (&quot;Syncra&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) for
          access to the <strong>{LEGAL_PLATFORM}</strong> platform (&quot;Platform&quot;).
        </LegalParagraph>
        <LegalParagraph>
          {LEGAL_PLATFORM} is sold on a business-to-business (B2B) SaaS basis to Societies and their authorized
          representatives. This Policy should be read together with our{' '}
          <Link to="/legal/terms" className="font-medium text-syncra-blue hover:underline">
            Terms & Conditions
          </Link>{' '}
          and{' '}
          <Link to="/legal/privacy" className="font-medium text-syncra-blue hover:underline">
            Privacy Policy
          </Link>
          .
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="2. General Principle — No Refunds After Billing Cycle Commencement">
        <LegalParagraph>
          All subscription fees, activation fees, and prepaid add-on charges are{' '}
          <strong>non-refundable once the applicable billing cycle has commenced</strong>, except where expressly stated
          in this Policy or required by mandatory applicable law.
        </LegalParagraph>
        <LegalParagraph>
          Because the Platform is provisioned immediately upon payment confirmation — including creation of the Society
          workspace, activation of selected modules, allocation of messaging credits (where applicable), and enablement
          of administrative and resident-facing features — fees compensate Syncra for software access, infrastructure,
          and support for the full committed period.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="3. Subscription Billing Cycles">
        <LegalParagraph>
          Societies may subscribe on monthly, quarterly, or annual billing cycles as offered on the Platform or in a
          written order form. Each cycle is billed in advance. The billing cycle commences on the date payment is
          successfully captured or on the subscription start date stated on the invoice, whichever is earlier.
        </LegalParagraph>
        <LegalParagraph>
          Upgrades to higher tiers or activation of premium add-ons (including WhatsApp Automation, AI Voice Helpdesk,
          or Encrypted Election Module) are charged pro-rata or as a full add-on fee for the remainder of the current
          billing cycle, as displayed at checkout. Such charges are non-refundable once the add-on is activated.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="activation-fee" title="4. One-Time Activation Fee">
        <LegalParagraph>
          Certain onboarding plans include a one-time platform activation fee payable before flat configuration and
          recurring billing setup. The activation fee covers initial provisioning, environment configuration, and
          onboarding support.
        </LegalParagraph>
        <LegalParagraph>
          The activation fee is <strong>non-refundable</strong> once paid, including if the Society chooses not to
          complete onboarding, fails to configure flats, or cancels before recurring billing begins, except where Syncra
          fails to provision any part of the Service due to a fault solely attributable to Syncra and not remedied
          within thirty (30) days of written notice.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="cancellation" title="5. Society-Initiated Cancellation">
        <LegalParagraph>
          A Society may cancel its Subscription by providing written notice to{' '}
          <a href={`mailto:${LEGAL_BILLING_EMAIL}`} className="font-medium text-syncra-blue hover:underline">
            {LEGAL_BILLING_EMAIL}
          </a>{' '}
          with at least <strong>thirty (30) days&apos; prior notice</strong> before the next billing cycle renewal date.
        </LegalParagraph>
        <LegalParagraph>
          Cancellation takes effect at the end of the current prepaid billing period. The Society will retain access to
          paid features until that date. No partial refunds or credits are issued for unused days within an active
          billing cycle, unused flat seats, or unused messaging volume included in bundled add-on packs.
        </LegalParagraph>
        <LegalParagraph>
          Cancellation notice must be sent from the registered billing contact email or by an authorized Society
          Administrator identified in the account. Syncra may request reasonable verification of authority before
          processing cancellation.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="6. Non-Payment and Syncra-Initiated Termination">
        <LegalParagraph>
          If subscription or add-on fees are not paid by the due date, Syncra may suspend access after a grace period
          (typically seven (7) days from invoice due date unless otherwise stated) and terminate the account if payment
          remains outstanding. Suspension or termination for non-payment does not entitle the Society to any refund of
          previously paid amounts.
        </LegalParagraph>
        <LegalParagraph>
          Syncra may terminate access immediately for material breach of the Terms & Conditions, including abuse of
          messaging integrations or violation of the Acceptable Use Policy, without refund.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="7. Free Trials and Promotional Credits">
        <LegalParagraph>
          From time to time, Syncra may offer limited free trials or promotional credits at its discretion. Trial
          periods convert to paid subscriptions unless cancelled before the trial end date in accordance with trial
          terms displayed at signup. Promotional credits have no cash value and are non-refundable.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="8. Messaging and Consumption-Based Add-Ons">
        <LegalParagraph>
          WhatsApp, SMS, and voice add-ons may include fixed monthly fees and/or prepaid message volume packs. Once a
          volume pack is purchased or a monthly messaging add-on cycle begins, fees are non-refundable regardless of
          actual messages sent. Unused messages in a prepaid pack do not roll over unless explicitly stated in the
          order confirmation.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="9. Service Outages and SLA Credits">
        <LegalParagraph>
          Syncra uses commercially reasonable efforts to maintain Platform availability. Planned maintenance will, where
          practicable, be communicated in advance. Isolated downtime, third-party provider outages (including Supabase
          or Twilio), or force majeure events do not automatically entitle Societies to refunds.
        </LegalParagraph>
        <LegalParagraph>
          If Syncra offers a written service level agreement (SLA) to an enterprise Society, any service credits under
          that SLA are the exclusive remedy for covered availability failures and are applied as billing credits, not
          cash refunds, unless otherwise agreed in writing.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="10. Duplicate Payments and Billing Errors">
        <LegalParagraph>
          If you believe you were charged in error or billed twice for the same billing period, contact{' '}
          <a href={`mailto:${LEGAL_BILLING_EMAIL}`} className="font-medium text-syncra-blue hover:underline">
            {LEGAL_BILLING_EMAIL}
          </a>{' '}
          within fifteen (15) days of the charge with invoice number and payment reference. Verified duplicate charges or
          proven billing errors will be refunded to the original payment method within fourteen (14) business days.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="11. Chargebacks and Payment Disputes">
        <LegalParagraph>
          Societies agree to contact Syncra to resolve billing disputes before initiating chargebacks or payment
          reversals with their bank or card issuer. Unjustified chargebacks may result in immediate account suspension
          and recovery of associated fees, interest, and reasonable administrative costs permitted by law.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="12. Taxes">
        <LegalParagraph>
          All fees are exclusive of applicable taxes, including GST. Invoices will reflect taxes as required by Indian
          law. Tax amounts paid are non-refundable except where Syncra is required by law to refund tax or issue a
          credit note.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="13. Data Export After Cancellation">
        <LegalParagraph>
          Following cancellation, Societies may request export of their workspace data within thirty (30) days of the
          effective cancellation date, subject to technical feasibility and payment of any outstanding amounts. After
          this window, Syncra may delete Society data in accordance with the Privacy Policy.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="14. Changes to This Policy">
        <LegalParagraph>
          Syncra may update this Policy from time to time. Changes apply to renewals and new purchases after the
          updated effective date. Material changes will be communicated to registered billing contacts or posted on the
          Platform.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="15. Contact for Billing and Refund Requests">
        <LegalParagraph>
          Billing and cancellation requests:{' '}
          <a href={`mailto:${LEGAL_BILLING_EMAIL}`} className="font-medium text-syncra-blue hover:underline">
            {LEGAL_BILLING_EMAIL}
          </a>
          <br />
          General support:{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-medium text-syncra-blue hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
        </LegalParagraph>
        <LegalParagraph>
          Please include your Society name, registered billing email, invoice number, and a detailed description of your
          request. We aim to acknowledge billing enquiries within two (2) business days.
        </LegalParagraph>
      </LegalSection>
    </LegalPageLayout>
  )
}
