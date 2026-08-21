# Governance

How Rishwat.fyi is governed, and how it is funded without compromising credibility.

The product's only real asset is trust. Governance and funding exist to protect that trust: no single person, party, or department should be able to bend the data, the moderation, or the methodology. Long-term governance should not depend entirely on the founder (plan §21).

## Governance roles (plan §21)

| Role | Responsibility |
| --- | --- |
| **Technical maintainers** | Maintain the software — the API, schema, migrations, tooling, and infrastructure. Keep the code open and the builds reproducible. |
| **Data stewards** | Maintain the methodology and dataset quality — the seed data, the government source registry, aggregate definitions, and the data dictionary. They are the guardians of what gets counted and how. |
| **Independent reviewers** | Review difficult moderation cases. A standing, volunteer group kept separate from the technical maintainers and from any single government department or political party. |
| **Community contributors** | Submit service information, government sources, and reports. Contributors are the network effect: more contributors → more coverage → better data. |
| **Public mirrors** | Independently preserve datasets and software so the project survives any single point of failure. See [Mirroring](mirroring.md). |

The roles are intentionally separated: the people who write the code are not the people who decide what the data means, and neither are the people who judge hard moderation cases. That separation is the structural answer to the question "who watches the watchmen."

## Independence

Governance stays independent from individual political parties and government departments (plan §20). That means:

- No party, department, or commercial interest appoints or controls moderators, data stewards, or reviewers.
- Funding (below) never buys influence over what is published, what is removed, or how statistics are computed.
- The methodology and moderation rules are published and version-controlled, so deviations are visible.

## Funding philosophy (plan §22)

Funding is designed to avoid incentives that compromise credibility.

**Acceptable funding sources:**

- Grants
- Philanthropic funding
- Research partnerships
- Non-profit structures
- Responsible sponsorship
- Public-interest technology funding

**Explicitly avoided:**

> "Pay us and we'll remove your report."

A pay-to-remove scheme destroys the product's legitimacy. It is not simply disfavored — it is structurally impossible, because removal is only possible through the processes defined in [Moderation](moderation.md) (reject, withdraw) and [Privacy](privacy.md) (correction, withdrawal). There is no price at which a report or statistic changes.

The same logic extends to monetizing individual allegations: the platform does not sell prominence, placement, or favorable treatment of any allegation. It publishes aggregates, not accusations, and it does not accept money to make an accusation go away.

## Licensing

Openness is what makes this independence enforceable, so code and data are both openly licensed — but **separately**, because they carry different rights (plan §12):

- **Code** — the API, schema, migrations, tooling, and everything else in the repository — is licensed under the **MIT License**. See [`LICENSE`](../LICENSE).
- **Published data** — the dataset exports and snapshots — is licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**, attribution required. See [`LICENSE-DATA`](../LICENSE-DATA).

Anyone may mirror, fork, and redistribute both under these terms; a mirror that credits the source cannot be quietly cut off. See [Mirroring](mirroring.md).

## Where governance meets the data

Governance is not an appendix to the project; it is load-bearing:

- The **status ladder** and publishing threshold in [Methodology](methodology.md) are the data-side expression of the governance rules — they decide what counts as a fact.
- The **moderation log** and escalation path in [Moderation](moderation.md) are the enforcement arm.
- The **privacy guarantees** in [Privacy](privacy.md) are the boundary conditions every role operates within.

If the website disappears, governance survives in the mirrorable artifacts: the open code, the dataset exports, the methodology, and the documented roles any successor community can adopt.