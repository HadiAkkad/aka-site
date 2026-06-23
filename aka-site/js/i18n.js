/* =========================================================================
   AKA — Bilingual (English / Arabic) support
   -------------------------------------------------------------------------
   HOW IT WORKS:
   - Every translatable piece of text in the HTML carries a data-i18n="key".
   - The dictionaries below map each key to its English and Arabic text.
   - On load (and when the toggle is clicked) we walk the page, swap the text,
     set the page direction (LTR / RTL) and remember the choice in the browser.

   TO TRANSLATE MORE TEXT:
   1. Add  data-i18n="some.key"  to the HTML element.
   2. Add  "some.key": "..."  to BOTH the en and ar dictionaries below.
   For attributes (e.g. a placeholder) use  data-i18n-attr="placeholder:some.key".
   ========================================================================= */

const I18N = (() => {
  const STORAGE_KEY = "aka-lang";

  const dict = {
    en: {
      // Header / nav
      "nav.home": "Home",
      "nav.devices": "Devices",
      "nav.supplements": "Supplements",
      "nav.partners": "Partners",
      "nav.projects": "Projects",
      "nav.about": "About",
      "nav.support": "Services",
      "nav.careers": "Careers",
      "lang.toggle": "العربية",
      "lang.toggleLabel": "التبديل إلى العربية",

      // Footer
      "footer.about.text":
        "Certified medical devices and equipment for hospitals, clinics, and laboratories across Syria backed by agency services, installation, training, and dependable local support.",
      "footer.explore": "Explore",
      "footer.contact": "Contact",
      "footer.devices": "Devices",
      "footer.categories": "Categories",
      "footer.supplements": "Supplements",
      "footer.partners": "Partners",
      "footer.projects": "Projects",
      "footer.about": "About",
      "footer.support": "Services",
      "footer.careers": "Careers",
      "footer.location": "Syria",
      "footer.rights": "All rights reserved.",

      // Home — hero
      "home.hero.h1": "Your Partner in Healthcare",
      "home.hero.lead":
        "Since 1998, AKA has reliably supplied certified medical devices and equipment to hospitals, clinics, and laboratories across Syria  backed by installation, training, and dependable local service.",
      "home.hero.cta": "Browse our devices",

      // Home — services
      "home.services.title": "What we do",
      "home.services.devices.title": "Medical devices",
      "home.services.devices.text":
        "Certified diagnostic, monitoring, surgical, and hospital equipment, delivered, installed, and serviced locally.",
      "home.services.supplements.title": "Supplements",
      "home.services.supplements.text":
        "Quality dietary supplements and consumables for pharmacies and healthcare providers.",
      "home.services.agency.title": "Agency services",
      "home.services.agency.text":
        "International agency and procurement support connecting Syrian healthcare to global manufacturers.",
      "home.services.service.title": "Service & support",
      "home.services.service.text":
        "Installation, training, maintenance, and spare parts dependable after-sales service for every device we supply.",

      // Home — stats bar
      "home.stats.years.label": "Years of experience",
      "home.stats.hospitals.label": "Hospitals delivered",
      "home.stats.partners.label": "International partners",
      "home.stats.ngo.label": "NGO & UN partnerships",

      // Home — products teaser
      "home.products.title": "Our medical products",
      "home.products.lead":
        "Explore our device portfolio by clinical category from patient monitoring and diagnostics to surgical and hospital equipment.",
      "home.products.cta": "Browse categories",

      // Home — featured projects
      "home.featured.title": "Hospitals we've equipped",
      "home.featured.lead":
        "A selection of hospitals AKA Group has built and/or equipped across Syria.",
      "home.featured.cta": "See all our projects",

      // Home — inquiry form
      "home.inquiry.title": "Send an inquiry",
      "home.inquiry.lead":
        "Tell us what your facility needs and our team will get back to you with details and a tailored quotation.",
      "form.name": "Name",
      "form.email": "Email",
      "form.message": "Message",
      "form.submit": "Submit",
      "form.sending": "Sending…",
      "form.success": "Thank you your message has been sent.",
      "form.applied": "Thank you your application has been submitted.",
      "form.error": "Something went wrong. Please try again or email us directly.",

      // Home — contact band
      "home.contact.title": "Contact AKA",
      "home.contact.lead":
        "Questions about products, specifications, or partnerships?",
      "home.contact.cta": "Email us",

      // Home — section eyebrows (small accent label above each heading)
      "home.sectors.eyebrow": "What we do",
      "home.products.eyebrow": "Our products",
      "home.why.eyebrow": "Why AKA",
      "home.featured.eyebrow": "Our track record",
      "home.inquiry.eyebrow": "Get in touch",

      // ---- AKA Group: sectors (home) ----
      "home.sectors.title": "Our sectors",
      "home.sectors.lead": "AKA Group is a multidisciplinary group serving healthcare through four specialized sectors.",
      "sector.projects.title": "Projects (Turnkey)",
      "sector.projects.text": "Turnkey healthcare infrastructure from planning and design to installation and commissioning of complete hospitals and medical centers.",
      "sector.tenders.title": "Tenders",
      "sector.tenders.text": "Strategic participation in public and private tenders inside and outside Syria across Europe, Asia, and Africa with full regulatory compliance.",
      "sector.medical.title": "Medical Equipment & Services",
      "sector.medical.text": "Supply, installation, and maintenance of advanced medical devices through FutureMed and affiliated companies, partnering with leading global manufacturers.",
      "sector.humanitarian.title": "Humanitarian & Charitable",
      "sector.humanitarian.text": "Charitable activities and annual humanitarian campaigns that improve healthcare access in underserved regions, including emergency response through MerMed.",

      // ---- Projects page ----
      "proj.hero.h1": "Projects & Clients",
      "proj.hero.lead": "AKA Group has delivered large-scale healthcare projects across Syria building, equipping, and commissioning hospitals and medical centers.",
      "proj.hero.cta": "See our projects",
      "proj.hospitals.eyebrow": "Our work",
      "proj.hospitals.title": "Hospitals we've delivered",
      "proj.hospitals.lead": "A selection of hospitals AKA Group has built and/or equipped across Syria.",
      "proj.ct.title": "CT imaging installations",
      "proj.ct.text": "Supplied and installed CT scanning systems at Zahi Azraq Hospital, Homs Hospital, Al Sayda Hospital (Latakia), and Aga Khan Medical Center.",
      "proj.ministry.title": "Public-sector partnerships",
      "proj.ministry.text": "AKA Group works with hospitals affiliated with the Ministry of Health and the Ministry of Higher Education and Scientific Research.",
      "proj.investments.eyebrow": "Investments",
      "proj.investments.title": "Our investments",
      "proj.investments.text": "Al-Ridaa Hospital (Deir Al-Zour) and Al-Hayat Hospital (Damascus).",
      "proj.investments.alridaa.name": "Al-Ridaa Hospital",
      "proj.investments.alridaa.location": "Deir Al-Zour",
      "proj.investments.alridaa.desc": "A modern, fully-equipped acute care facility serving the eastern region with comprehensive surgical, diagnostic, and emergency services.",
      "proj.investments.alhayat.name": "Al-Hayat Hospital",
      "proj.investments.alhayat.location": "Damascus",
      "proj.investments.alhayat.desc": "A premier multi-specialty hospital in the capital, equipped with state-of-the-art imaging, surgical suites, and intensive care units.",
      "proj.cta.title": "Have a project in mind?",
      "proj.cta.p": "From turnkey hospitals to a single department, AKA Group can plan, equip, and commission it.",

      // ---- Values & vision (About) ----
      "about.values.title": "Our values & vision",
      "about.values.lead": "Core values that guide the quality of our products and services locally and regionally.",
      "about.values.customer.title": "Customer focus",
      "about.values.customer.text": "We prioritize understanding and meeting customer needs, and addressing risks to product conformity and satisfaction.",
      "about.values.support.title": "Support",
      "about.values.support.text": "We provide the resources, people, and infrastructure to deliver excellent service and build team competence.",
      "about.values.quality.title": "Quality",
      "about.values.quality.text": "We deliver organized, well-managed services that meet modern standards and satisfy our customers.",
      "about.values.improvement.title": "Continuous improvement",
      "about.values.improvement.text": "We collaborate with reputable partners to enhance our capabilities and drive continuous development.",

      // ---- Timeline (About) ----
      "about.timeline.title": "Our journey",
      "tl.1950": "AKA Group founded",
      "tl.1960": "Family business — construction industries",
      "tl.1962": "AKA fabric stores",
      "tl.1997": "Tenders, import contracts & water-purification plants",
      "tl.1998": "FutureMed Syria started",
      "tl.2003": "Zaher Al-Akkad Co.",
      "tl.2013": "MerMed started",
      "tl.2018": "FutureMed Sweden",
      "tl.2025": "FutureMed Albania",

      // ---- NGO partners (Agencies) ----
      "agencies.ngo.eyebrow": "Our network",
      "agencies.ngo.title": "Trusted by leading organizations",
      "agencies.ngo.lead": "Through our Tenders sector, AKA Group has partnered with major international organizations.",
      "ngo.agakhan.desc": "A global development agency working to improve quality of life through health, education, and economic initiatives.",
      "ngo.who.desc": "The United Nations agency that directs international health within the UN system, setting standards and coordinating health responses worldwide.",
      "ngo.undp.desc": "The UN's lead agency on international development, helping countries build resilient health systems and recover from crises.",
      "ngo.unhcr.desc": "The UN Refugee Agency, providing medical equipment and healthcare support to displaced populations across Syria.",
      "ngo.imc.desc": "A global humanitarian organization delivering emergency medical relief and healthcare training in crisis-affected regions.",

      // ---- Additional manufacturer partners ----
      "agencies.more.title": "More of our partners",
      "partner.cisa.desc": "Sterilization systems for hospitals and industry over 60 years of manufacturing expertise.",
      "partner.micromed.desc": "Neurophysiology solutions EEG, EMG, and evoked potentials.",
      "partner.kasios.desc": "Synthetic bone substitutes for orthopedic and dental surgery.",
      "partner.aspel.desc": "High-quality electrocardiograph (ECG) systems and devices.",
      "partner.luxsutures.desc": "Surgical sutures recognized by surgeons worldwide.",
      "partner.steelpower.desc": "Steam sterilizers and stainless-steel hospital furniture.",
      "partner.siem.desc": "Designs and manufactures medical emergency equipment.",
      "partner.item.desc": "Orthopedic implants for surgery and neurosurgery spine, foot, and hand.",
      "partner.insightra.desc": "Cardiovascular medical devices, since 2001.",
      "partner.sama.desc": "Helium/nitrogen supply and MRI/CT installation and service.",
      "partner.elvation.desc": "A leading German medical technology company specializing in endoscopic instruments and system solutions for minimally invasive procedures. Founded in 1906, the company has grown into a global organization with 18 branches and over 130 distributors worldwide.",
      "partner.esumedics.desc": "Esumedics stands for \"european sustainable medical solutions.\" Their focus is the development and distribution of long-lasting medical product solutions made in Germany, built on the wealth of experience and competence of their employees.",
      "partner.sternmed.desc": "Medical device manufacturer and solution provider for healthcare turnkey projects, with head office in Baden-Württemberg. Established in 2011, manufacturing affordable and durable medical devices with German quality standards to enhance healthcare globally.",
      "partner.perlove.desc": "A high-tech enterprise specialized in the development, manufacturing, and distribution of medical imaging systems, including X-ray machines, digital radiography systems, and mammography machines, with an emphasis on a variety of C-arm machine options.",

      // ---- Careers page ----
      "careers.hero.h1": "Careers at AKA",
      "careers.hero.lead":
        "Join our team. We're always looking for talented people in medical equipment, biomedical engineering, sales, and service across Syria.",
      "careers.apply.title": "Apply now",
      "careers.apply.lead":
        "Fill in the form below and attach your CV. Our team will review your application and get back to you.",
      "careers.form.phone": "Phone",
      "careers.form.position": "Position you're applying for",
      "careers.form.message": "Cover letter / message",
      "careers.form.cv": "Upload your CV (PDF or Word)",
      "careers.form.submit": "Submit application",

      // ---- About page ----
      "about.est": "Established 1998 · Damascus, Syria",
      "about.spec.title": "What we specialize in",
      "about.spec.1": "Medical device sales & distribution",
      "about.spec.2": "Repair & after-sales service",
      "about.spec.3": "Installation & operator training",
      "about.spec.4": "Tender management (national & international)",
      "about.spec.5": "Medical project management",
      "about.spec.6": "Operating room setup & management",
      "about.spec.7": "ICU setup & management",
      "about.spec.8": "Sterilization department setup",
      "about.hero.h1": "About AKA",
      "about.hero.lead":
        "Since 1998, AKA has reliably supplied certified medical devices and equipment to hospitals, clinics, and laboratories across Syria backed by installation, training, and dependable local service.",
      "about.hero.cta": "Contact us",
      "about.who.title": "Who we are",
      "about.who.p":
        "Founded in 1998 in Damascus, AKA (Al-Akkad) is a medical agencies group dedicated to advancing healthcare through modern medical equipment at the best quality and value. We supply ultrasound systems, surgical instruments, endoscopy and sterilization equipment, cardiac and neurological monitoring devices, and laboratory equipment backed by installation, training, repair, and dependable after-sales service across Syria.",
      "about.why.title": "Why choose AKA",
      "about.why.certified.title": "Certified products",
      "about.why.certified.text":
        "Genuine, certified equipment and supplies sourced from trusted international manufacturers.",
      "about.why.local.title": "Local service",
      "about.why.local.text":
        "Installation, training, maintenance, and after-sales support delivered on the ground in Syria.",
      "about.why.reliable.title": "Reliable partner",
      "about.why.reliable.text":
        "Years of dependable supply to healthcare providers who count on us for the long term.",
      "about.contact.title": "Find & contact us",
      "about.contact.lead":
        "Reach out by phone or email, or visit us our team is ready to help with products, specifications, and quotations.",
      "about.location.title": "Location",
      "about.phone.title": "Phone",
      "about.emailhours.title": "Email & hours",
      "about.hours": "Sat–Thu, 9:00 AM – 6:00 PM",
      "about.cta.title": "Ready to work with AKA?",
      "about.cta.lead":
        "Tell us what your facility needs and we'll get back to you with a tailored quotation.",
      "about.cta.btn": "Send an inquiry",

      // ---- Partners page ----
      "agencies.hero.h1": "Partners",
      "agencies.hero.lead":
        "AKA acts as a trusted partner — representing international medical manufacturers and working alongside leading NGOs and humanitarian organizations across Syria.",
      "agencies.hero.cta": "See our partners",
      "agencies.overview.eyebrow": "What we do",
      "agencies.overview.title": "Overview",
      "agencies.overview.p":
        "Through our agency services, AKA represents and sources from international manufacturers, handling procurement, import, and local distribution so healthcare providers in Syria can access genuine, certified products with confidence.",
      "agencies.help.eyebrow": "How it works",
      "agencies.help.title": "How we help",
      "agencies.help.sourcing.title": "Sourcing",
      "agencies.help.sourcing.text":
        "Identifying and securing the right products from trusted manufacturers.",
      "agencies.help.import.title": "Import & logistics",
      "agencies.help.import.text":
        "Managing procurement, shipping, and customs into Syria.",
      "agencies.help.dist.title": "Local distribution",
      "agencies.help.dist.text":
        "Delivery, installation, and after-sales support on the ground.",
      "agencies.cta.title": "Looking for a partner?",
      "agencies.cta.p":
        "Get in touch to discuss representation, sourcing, or distribution.",
      "agencies.cta.btn": "Contact us",

      // ---- Agencies: partner brands ----
      "agencies.partners.eyebrow": "Manufacturers",
      "agencies.partners.title": "Our partners",
      "agencies.partners.lead":
        "AKA is the authorized agent in Syria for leading international medical-equipment manufacturers.",
      "partner.visit": "Visit website",
      "partner.edan.desc":
        "Patient monitoring, ECG, ultrasound, point-of-care testing, and maternal/fetal solutions.",
      "partner.neurowerk.desc":
        "Neurology diagnostic systems EEG, EMG, and evoked potentials.",
      "partner.custo.desc":
        "Cardiopulmonary diagnostics resting and stress ECG, Holter monitoring, and spirometry.",
      "partner.ems.desc":
        "Swiss precision devices for endourology lithotripsy, dental prophylaxis, and shockwave therapy.",
      "partner.merivaara.desc":
        "Operating tables, surgical lights, and operating-room and ICU solutions.",
      "partner.neusoft.desc":
        "Diagnostic imaging systems — CT, MRI, X-ray, and ultrasound.",
      "partner.hermann.desc":
        "German manufacturer of surgical instruments and implants laparoscopy, endoscopy, electrosurgery, and arthroscopy.",
      "partner.emos.desc":
        "German manufacturer of high-quality rigid and flexible endoscopes for surgery, ENT, urology, and gastroenterology.",
      "partner.imo.desc":
        "ICU and hospital beds and furniture.",

      // ---- Devices page ----
      "devices.hero.h1": "Devices",
      "devices.hero.lead":
        "Browse our medical devices by clinical use. AKA supplies certified equipment for diagnostics, monitoring, surgery, and hospital care each backed by installation, training, and local support.",
      "devices.hero.cta": "Browse categories",
      "devices.portfolio.eyebrow": "Our catalog",
      "devices.portfolio.title": "A certified device portfolio",
      "devices.portfolio.p":
        "Every device AKA delivers is selected for reliability, ease of use, and compliance with international quality standards. From compact bedside units to full hospital installations, we help Syrian healthcare providers equip their facilities with confidence and keep them running with maintenance, spare parts, and dependable after-sales service.",
      "devices.process.eyebrow": "How it works",
      "devices.process.title": "From inquiry to installation",
      "devices.process.step1": "Inquiry",
      "devices.process.step2": "Quotation",
      "devices.process.step3": "Delivery",
      "devices.process.step4": "Installation",
      "devices.process.step5": "Training & support",
      "devices.featured.eyebrow": "In our portfolio",
      "devices.featured.title": "Featured devices",
      "devices.video.label": "Watch: Installation & training",
      "devices.docs.eyebrow": "Documentation",
      "devices.docs.title": "Device documentation for Syria",
      "devices.docs.btn": "View details",
      "devices.docs.p1":
        "Access technical files, user manuals, compatibility notes, and safety information for every AKA medical device supplied in Syria including installation requirements and Syrian regulatory references for biomedical engineers, hospital teams, and distributors.",
      "devices.docs.p2":
        "Verify whether each device suits your facility, with clear compatibility charts, power and networking standards for Syria, and documentation ready for tenders, audits, and Ministry of Health inspections.",

      // ---- Supplements page ----
      "supp.hero.h1": "Supplements",
      "supp.hero.lead":
        "Quality dietary supplements and consumables for pharmacies, clinics, and healthcare providers across Syria.",
      "supp.hero.cta": "Request a quote",
      "supp.overview.title": "Overview",
      "supp.overview.p":
        "AKA supplies a range of dietary supplements and healthcare consumables, sourced for quality and consistency.",
      "supp.offer.title": "What we offer",
      "supp.offer.vitamins.title": "Vitamins & minerals",
      "supp.offer.vitamins.text":
        "Core nutritional supplements for everyday and clinical needs.",
      "supp.offer.specialty.title": "Specialty formulas",
      "supp.offer.specialty.text":
        "Targeted supplements for specific dietary and therapeutic requirements.",
      "supp.offer.consumables.title": "Consumables",
      "supp.offer.consumables.text":
        "Reliable healthcare consumables for pharmacies and providers.",
      "supp.cta.title": "Interested in our supplements?",
      "supp.cta.p":
        "Contact AKA for the full product list and a tailored quotation.",
      "supp.cta.btn": "Request a quote",

      // ---- Support page ----
      "support.hero.h1": "Services",
      "support.hero.lead":
        "Technical documentation, installation, training, and dependable after-sales service for every device AKA supplies in Syria.",
      "support.hero.cta": "Contact support",
      "support.how.title": "How we support you",
      "support.doc.title": "Documentation",
      "support.doc.text":
        "User manuals, technical files, compatibility notes, and safety information with Syrian regulatory references for tenders, audits, and Ministry of Health inspections.",
      "support.install.title": "Installation",
      "support.install.text":
        "On-site installation and commissioning by trained technicians, with power and networking standards suited to Syria.",
      "support.training.title": "Training",
      "support.training.text":
        "Hands-on training for clinical and biomedical staff so your team can operate equipment safely and effectively.",
      "support.maint.title": "Maintenance & parts",
      "support.maint.text":
        "Preventive maintenance, repairs, and spare parts to keep your equipment running.",
      "support.cta.title": "Need help with a device?",
      "support.cta.lead":
        "Our team is ready to assist with documentation, service, and spare parts.",
      "support.cta.btn": "Email support",

      // ---- Categories (merged into Devices page) ----
      "cat.eyebrow": "Browse by category",
      "cat.title": "Categories",
      "cat.diagnostic": "Diagnostic Devices",
      "cat.monitoring": "Patient Monitoring",
      "cat.respiratory": "Respiratory Care",
      "cat.cardiology": "Cardiology",
      "cat.hospital": "Hospital Equipment",
      "cat.surgical": "Surgical Equipment",
      "cat.imaging": "Imaging & Ultrasound",
      "cat.lab": "Laboratory Equipment",
      "cat.endoscopy": "Endoscopy",
      "cat.sterilization": "Sterilization (CSSD)",
      "cat.neurology": "Neurology",
      "cat.orthopedics": "Orthopedics",

      // ---- Neurology page ----
      "neuro.lead":
        "Certified neurophysiology equipment for hospitals and clinics across Syria — supplied and serviced by AKA.",
      "neuro.overview":
        "Neurology equipment supports the diagnosis and monitoring of neurological conditions. AKA supplies certified EEG, EMG, and evoked-potential systems, selected for accuracy and reliability and backed by local installation, training, and technical support.",
      "neuro.o1t": "EEG systems",
      "neuro.o1d": "Electroencephalography systems for diagnosing neurological and seizure disorders.",
      "neuro.o2t": "EMG & nerve conduction",
      "neuro.o2d": "Electromyography and nerve conduction studies for neuromuscular assessment.",
      "neuro.o3t": "Evoked potentials",
      "neuro.o3d": "Evoked-potential systems for assessing sensory and neural pathway function.",

      // ---- Orthopedics page ----
      "ortho.lead":
        "Certified orthopedic implants and surgical solutions for hospitals and clinics across Syria — supplied and serviced by AKA.",
      "ortho.overview":
        "Orthopedic solutions support bone and joint surgery with reliable, certified products. AKA supplies bone substitutes and spine, foot, and hand implants, selected for safety and surgical precision and backed by local installation, training, and technical support.",
      "ortho.o1t": "Bone substitutes",
      "ortho.o1d": "Synthetic bone graft substitutes for orthopedic and dental surgery.",
      "ortho.o2t": "Spine implants",
      "ortho.o2d": "Implants and instrumentation for spinal surgery and neurosurgery.",
      "ortho.o3t": "Foot & hand implants",
      "ortho.o3d": "Implants for extremity surgery — foot, ankle, and hand procedures.",

      // ---- Diagnostic Devices page ----
      "diag.hero.h1": "Diagnostic Devices",
      "diag.hero.lead":
        "Accurate, reliable diagnostic equipment for hospitals, clinics, and laboratories across Syria supplied, installed, and serviced by AKA.",
      "diag.overview.title": "Overview",
      "diag.overview.p":
        "Diagnostic devices are the foundation of accurate clinical decision-making. AKA supplies a broad range of certified diagnostic equipment that helps Syrian healthcare providers detect, measure, and monitor patient conditions with confidence. Every device we deliver is selected for reliability, ease of use, and compliance with international quality standards, and is backed by local installation, training, and ongoing technical support.",
      "diag.offer.title": "What we offer",
      "diag.offer.ivd.title": "In-vitro diagnostics",
      "diag.offer.ivd.text":
        "Analyzers and test kits for blood, urine, and laboratory sample analysis.",
      "diag.offer.poc.title": "Point-of-care testing",
      "diag.offer.poc.text":
        "Compact devices for rapid bedside results in clinics and emergency settings.",
      "diag.offer.measure.title": "Measurement & monitoring",
      "diag.offer.measure.text":
        "Instruments for measuring vital parameters and supporting routine diagnosis.",
      "diag.why.title": "Why buy from AKA",
      "diag.why.certified.title": "Certified products",
      "diag.why.certified.text":
        "Genuine devices that meet international quality and safety standards.",
      "diag.why.install.title": "Installation & setup",
      "diag.why.install.text":
        "On-site installation and commissioning by trained technicians.",
      "diag.why.training.title": "Training",
      "diag.why.training.text":
        "Hands-on training for your clinical and biomedical staff.",
      "diag.why.service.title": "Service & support",
      "diag.why.service.text":
        "Maintenance, spare parts, and dependable local after-sales support.",
      "diag.cta.title": "Interested in our diagnostic devices?",
      "diag.cta.p":
        "Contact AKA for product details, specifications, and a tailored quotation for your facility.",
      "diag.cta.btn": "Request a quote",

      // ---- Shared category-page CTA ----
      "catpage.cta.title": "Interested in this category?",
      "catpage.cta.p":
        "Contact AKA for product details, specifications, and a tailored quotation for your facility.",
      "catpage.cta.btn": "Request a quote",

      // ---- Endoscopy ----
      "endo.lead":
        "Endoscopy systems and instruments for diagnostic and surgical use in hospitals and clinics across Syria supplied, installed, and serviced by AKA.",
      "endo.overview":
        "Endoscopy enables minimally invasive diagnosis and treatment. AKA supplies certified endoscopy systems, scopes, and accessories — selected for image quality and reliability and backed by local installation, training, and technical support.",
      "endo.o1t": "Endoscopy towers",
      "endo.o1d": "Cameras, light sources, and processors for the OR and endoscopy suite.",
      "endo.o2t": "Rigid & flexible scopes",
      "endo.o2d": "Scopes for surgical, GI, ENT, and urology procedures.",
      "endo.o3t": "Instruments & accessories",
      "endo.o3d": "Endoscopic instruments, accessories, and consumables.",

      // ---- Sterilization (CSSD) ----
      "steril.lead":
        "Sterilization and CSSD equipment for hospitals and surgical centers across Syria supplied, installed, and serviced by AKA.",
      "steril.overview":
        "Reliable sterilization protects patients and staff. AKA supplies certified autoclaves, washer-disinfectors, and CSSD equipment, selected for safety and compliance and backed by local installation, training, and service. We also help plan and equip complete sterilization departments.",
      "steril.o1t": "Autoclaves & sterilizers",
      "steril.o1d": "Steam and low-temperature sterilizers for every load size.",
      "steril.o2t": "Washer-disinfectors",
      "steril.o2d": "Automated cleaning and disinfection for instruments.",
      "steril.o3t": "CSSD planning",
      "steril.o3d": "Department design, workflow, and equipping for central sterile supply.",

      // ---- Patient Monitoring ----
      "mon.lead":
        "Continuous, accurate monitoring of vital signs for critical care, operating rooms, and general wards across Syria supplied and serviced by AKA.",
      "mon.overview":
        "Patient monitoring systems give clinicians a real-time picture of a patient's condition. AKA supplies certified bedside and central monitoring solutions — from compact vital-signs units to multi-parameter ICU monitors — selected for accuracy, reliability, and ease of use, and backed by local installation, training, and technical support.",
      "mon.o1t": "Bedside monitors",
      "mon.o1d": "Multi-parameter monitors for ICU, CCU, and operating rooms.",
      "mon.o2t": "Vital signs monitors",
      "mon.o2d": "Compact spot-check devices for wards and outpatient clinics.",
      "mon.o3t": "Central stations",
      "mon.o3d": "Networked central monitoring for whole departments.",

      // ---- Respiratory Care ----
      "resp.lead":
        "Reliable respiratory and ventilation equipment for hospitals, clinics, and emergency care across Syria supplied and serviced by AKA.",
      "resp.overview":
        "Respiratory care equipment supports patients who need help breathing, from emergencies to long-term care. AKA supplies certified ventilators, oxygen therapy, and airway-management devices, chosen for safety and reliability and backed by local installation, training, and ongoing service.",
      "resp.o1t": "Ventilators",
      "resp.o1d": "Invasive and non-invasive ventilation for ICU and emergency use.",
      "resp.o2t": "Oxygen therapy",
      "resp.o2d": "Concentrators, flowmeters, and oxygen delivery systems.",
      "resp.o3t": "Airway management",
      "resp.o3d": "Nebulizers, suction units, and respiratory consumables.",

      // ---- Cardiology ----
      "card.lead":
        "Certified cardiac diagnostic and monitoring equipment for hospitals and clinics across Syria supplied and serviced by AKA.",
      "card.overview":
        "Cardiology equipment helps detect, monitor, and manage heart conditions. AKA supplies certified ECG, defibrillation, and cardiac monitoring devices, selected for accuracy and reliability and backed by local installation, training, and technical support.",
      "card.o1t": "ECG machines",
      "card.o1d": "Resting and stress ECG systems for diagnosis and screening.",
      "card.o2t": "Defibrillators",
      "card.o2d": "Manual and automated external defibrillators (AEDs).",
      "card.o3t": "Cardiac monitoring",
      "card.o3d": "Holter and bedside cardiac monitoring solutions.",

      // ---- Hospital Equipment ----
      "hosp.lead":
        "Durable hospital and ward equipment for healthcare facilities across Syria supplied, installed, and serviced by AKA.",
      "hosp.overview":
        "From patient beds to ward furniture and mobility equipment, AKA supplies the essential infrastructure that keeps hospitals and clinics running. Every item is selected for durability and safety and backed by local delivery, installation, and after-sales support.",
      "hosp.o1t": "Hospital beds",
      "hosp.o1d": "Manual and electric beds for wards, ICU, and recovery.",
      "hosp.o2t": "Ward furniture",
      "hosp.o2d": "Trolleys, cabinets, examination couches, and stretchers.",
      "hosp.o3t": "Mobility & transfer",
      "hosp.o3d": "Wheelchairs, patient lifts, and transfer aids.",

      // ---- Surgical Equipment ----
      "surg.lead":
        "Certified surgical instruments and operating-room equipment for hospitals across Syria supplied and serviced by AKA.",
      "surg.overview":
        "Surgical equipment must perform flawlessly under pressure. AKA supplies certified operating-room equipment, electrosurgical units, and instruments, selected for precision and reliability and backed by local installation, training, and service.",
      "surg.o1t": "Operating tables & lights",
      "surg.o1d": "Surgical tables, lights, and OR infrastructure.",
      "surg.o2t": "Electrosurgery",
      "surg.o2d": "Diathermy and energy-based surgical systems.",
      "surg.o3t": "Surgical instruments",
      "surg.o3d": "Quality instrument sets for a range of procedures.",

      // ---- Medical Imaging ----
      "imag.lead":
        "Diagnostic imaging systems for hospitals, clinics, and radiology centers across Syria supplied, installed, and serviced by AKA.",
      "imag.overview":
        "Medical imaging is essential to accurate diagnosis. AKA supplies certified imaging systems — from X-ray and ultrasound to specialized modalities — selected for image quality and reliability and backed by local installation, training, and technical support.",
      "imag.o1t": "X-ray systems",
      "imag.o1d": "Fixed and mobile radiography for hospitals and clinics.",
      "imag.o2t": "Ultrasound",
      "imag.o2d": "Diagnostic ultrasound for radiology, OB/GYN, and point of care.",
      "imag.o3t": "Imaging accessories",
      "imag.o3d": "Viewers, printers, and imaging consumables.",

      // ---- Laboratory Equipment ----
      "lab.lead":
        "Certified laboratory analyzers and equipment for hospitals, clinics, and labs across Syria supplied and serviced by AKA.",
      "lab.overview":
        "Reliable laboratory equipment underpins accurate testing. AKA supplies certified analyzers, centrifuges, and lab instruments, selected for precision and durability and backed by local installation, training, and ongoing support.",
      "lab.o1t": "Analyzers",
      "lab.o1d": "Hematology, biochemistry, and immunoassay analyzers.",
      "lab.o2t": "General lab equipment",
      "lab.o2d": "Centrifuges, microscopes, incubators, and more.",
      "lab.o3t": "Reagents & consumables",
      "lab.o3d": "Test kits and consumables for routine laboratory work.",

      // ---- Dental Equipment ----
      "dent.lead":
        "Complete dental equipment for clinics and practices across Syria supplied, installed, and serviced by AKA.",
      "dent.overview":
        "AKA supplies certified dental equipment for clinics of every size from dental chairs and units to imaging and handpieces — selected for reliability and patient comfort and backed by local installation, training, and service.",
      "dent.o1t": "Dental chairs & units",
      "dent.o1d": "Complete treatment units for general and specialist practice.",
      "dent.o2t": "Dental imaging",
      "dent.o2d": "Intraoral and panoramic X-ray systems.",
      "dent.o3t": "Instruments & consumables",
      "dent.o3d": "Handpieces, instruments, and clinic consumables.",

      // ---- Consumables & Supplies ----
      "cons.lead":
        "Reliable medical consumables and disposables for hospitals, clinics, and pharmacies across Syria — supplied by AKA.",
      "cons.overview":
        "Day-to-day care depends on a steady supply of quality consumables. AKA supplies certified disposables, infection-control products, and medical supplies, sourced for quality and consistency and delivered dependably across Syria.",
      "cons.o1t": "Disposables",
      "cons.o1d": "Syringes, gloves, dressings, and single-use supplies.",
      "cons.o2t": "Infection control",
      "cons.o2d": "PPE, sterilization, and hygiene products.",
      "cons.o3t": "Medical supplies",
      "cons.o3d": "Everyday consumables for wards, clinics, and labs.",

      // ---- Gynecology & Obstetrics ----
      "gyn.lead":
        "Equipment for women's health, maternity, and delivery care across Syria — supplied, installed, and serviced by AKA.",
      "gyn.overview":
        "AKA supplies certified gynecology and obstetrics equipment for clinics and maternity units — from examination and ultrasound to delivery and neonatal care selected for safety and reliability and backed by local installation, training, and service.",
      "gyn.o1t": "Ultrasound & diagnostics",
      "gyn.o1d": "OB/GYN ultrasound and examination equipment.",
      "gyn.o2t": "Delivery & maternity",
      "gyn.o2d": "Delivery beds, examination couches, and maternity equipment.",
      "gyn.o3t": "Neonatal care",
      "gyn.o3d": "Infant warmers, incubators, and phototherapy units.",

      // ---- Urology ----
      "uro.lead":
        "Urology diagnostic and treatment equipment for hospitals and clinics across Syria — supplied and serviced by AKA.",
      "uro.overview":
        "AKA supplies certified urology equipment for diagnosis and treatment — from endoscopy and ultrasound to lithotripsy and consumables selected for reliability and backed by local installation, training, and technical support.",
      "uro.o1t": "Endoscopy",
      "uro.o1d": "Cystoscopes and endoscopic systems for urology.",
      "uro.o2t": "Diagnostics",
      "uro.o2d": "Urodynamic and ultrasound systems for assessment.",
      "uro.o3t": "Treatment & consumables",
      "uro.o3d": "Lithotripsy support and urology consumables.",
    },

    ar: {
      // Header / nav
      "nav.home": "الرئيسية",
      "nav.devices": "الأجهزة",
      "nav.supplements": "المكمّلات",
      "nav.partners": "شركاؤنا",
      "nav.projects": "المشاريع",
      "nav.about": "من نحن",
      "nav.support": "خدماتنا",
      "nav.careers": "الوظائف",
      "lang.toggle": "EN",
      "lang.toggleLabel": "Switch to English",

      // Footer
      "footer.about.text":
        "أجهزة ومعدات طبية معتمدة للمشافي والعيادات والمختبرات في جميع أنحاء سوريا مدعومة بخدمات الوكالة والتركيب والتدريب والدعم المحلي الموثوق.",
      "footer.explore": "استكشف",
      "footer.contact": "تواصل معنا",
      "footer.devices": "الأجهزة",
      "footer.categories": "الفئات",
      "footer.supplements": "المكمّلات",
      "footer.partners": "شركاؤنا",
      "footer.projects": "المشاريع",
      "footer.about": "من نحن",
      "footer.support": "خدماتنا",
      "footer.careers": "الوظائف",
      "footer.location": "سوريا",
      "footer.rights": "جميع الحقوق محفوظة.",

      // Home — hero
      "home.hero.h1": "شريكك في الرعاية الصحية",
      "home.hero.lead":
        "منذ عام 1998، وفّرت AKA بشكل موثوق أجهزة ومعدات طبية معتمدة للمشافي والعيادات والمختبرات في جميع أنحاء سوريا مدعومة بالتركيب والتدريب وخدمة محلية يُعتمد عليها.",
      "home.hero.cta": "تصفّح أجهزتنا",

      // Home — services
      "home.services.title": "ماذا نقدّم",
      "home.services.devices.title": "الأجهزة الطبية",
      "home.services.devices.text":
        "أجهزة تشخيص ومراقبة وجراحة ومعدات مشافي معتمدة، يتم توريدها وتركيبها وصيانتها محليًا.",
      "home.services.supplements.title": "المكمّلات",
      "home.services.supplements.text":
        "مكمّلات غذائية ومستلزمات عالية الجودة للصيدليات ومقدّمي الرعاية الصحية.",
      "home.services.agency.title": "خدمات الوكالة",
      "home.services.agency.text":
        "دعم الوكالة والتوريد الدولي لربط القطاع الصحي السوري بالشركات المصنّعة العالمية.",
      "home.services.service.title": "الخدمة والدعم",
      "home.services.service.text":
        "تركيب وتدريب وصيانة وقطع غيار — خدمة ما بعد بيع موثوقة لكل جهاز نورّده.",

      // Home — stats bar
      "home.stats.years.label": "سنة من الخبرة",
      "home.stats.hospitals.label": "مشافٍ تم تجهيزها",
      "home.stats.partners.label": "شريك دولي",
      "home.stats.ngo.label": "شراكة مع منظمات أممية وغير حكومية",

      // Home — products teaser
      "home.products.title": "منتجاتنا الطبية",
      "home.products.lead":
        "استكشف مجموعتنا من الأجهزة حسب الفئة السريرية من مراقبة المرضى والتشخيص إلى المعدات الجراحية ومعدات المشافي.",
      "home.products.cta": "تصفّح الفئات",

      // Home — featured projects
      "home.featured.title": "مشافٍ قمنا بتجهيزها",
      "home.featured.lead":
        "مجموعة من المشافي التي أنشأتها و/أو جهّزتها مجموعة AKA في سوريا.",
      "home.featured.cta": "عرض جميع مشاريعنا",

      // Home — inquiry form
      "home.inquiry.title": "أرسل استفسارًا",
      "home.inquiry.lead":
        "أخبرنا باحتياجات منشأتك وسيتواصل معك فريقنا بالتفاصيل وعرض سعر مخصّص.",
      "form.name": "الاسم",
      "form.email": "البريد الإلكتروني",
      "form.message": "الرسالة",
      "form.submit": "إرسال",
      "form.sending": "جارٍ الإرسال…",
      "form.success": "شكرًا لك — تم إرسال رسالتك.",
      "form.applied": "شكرًا لك — تم إرسال طلبك.",
      "form.error": "حدث خطأ ما. يرجى المحاولة مرة أخرى أو مراسلتنا مباشرة.",

      // Home — contact band
      "home.contact.title": "تواصل مع AKA",
      "home.contact.lead": "لديك أسئلة عن المنتجات أو المواصفات أو الشراكات؟",
      "home.contact.cta": "راسلنا",

      // Home — section eyebrows
      "home.sectors.eyebrow": "ماذا نقدّم",
      "home.products.eyebrow": "منتجاتنا",
      "home.why.eyebrow": "لماذا AKA",
      "home.featured.eyebrow": "سجلّنا الحافل",
      "home.inquiry.eyebrow": "تواصل معنا",

      // ---- AKA Group: sectors (home) ----
      "home.sectors.title": "قطاعاتنا",
      "home.sectors.lead": "مجموعة AKA مجموعة متعددة التخصّصات تخدم القطاع الصحي عبر أربعة قطاعات متخصّصة.",
      "sector.projects.title": "المشاريع (تسليم مفتاح)",
      "sector.projects.text": "بنية تحتية صحية متكاملة من التخطيط والتصميم إلى التركيب والتشغيل لمشافٍ ومراكز طبية كاملة.",
      "sector.tenders.title": "المناقصات",
      "sector.tenders.text": "مشاركة استراتيجية في المناقصات العامة والخاصة داخل سوريا وخارجها في أوروبا وآسيا وأفريقيا مع التزام كامل بالأنظمة.",
      "sector.medical.title": "التجهيزات والخدمات الطبية",
      "sector.medical.text": "توريد وتركيب وصيانة الأجهزة الطبية المتقدّمة عبر FutureMed والشركات التابعة، بالشراكة مع كبرى الشركات المصنّعة العالمية.",
      "sector.humanitarian.title": "الإنساني والخيري",
      "sector.humanitarian.text": "أنشطة خيرية وحملات إنسانية سنوية تُحسّن الوصول إلى الرعاية الصحية في المناطق المحرومة، بما في ذلك الاستجابة الطارئة عبر MerMed.",

      // ---- Projects page ----
      "proj.hero.h1": "المشاريع والعملاء",
      "proj.hero.lead": "نفّذت مجموعة AKA مشاريع صحية واسعة النطاق في جميع أنحاء سوريا بناءً وتجهيزًا وتشغيلًا للمشافي والمراكز الطبية.",
      "proj.hero.cta": "شاهد مشاريعنا",
      "proj.hospitals.eyebrow": "أعمالنا",
      "proj.hospitals.title": "مشافٍ نفّذناها",
      "proj.hospitals.lead": "مجموعة مختارة من المشافي التي بنتها و/أو جهّزتها مجموعة AKA في أنحاء سوريا.",
      "proj.ct.title": "تركيبات التصوير المقطعي",
      "proj.ct.text": "توريد وتركيب أنظمة التصوير المقطعي في مشفى زاهي أزرق، ومشفى حمص، ومشفى السيدة (اللاذقية)، ومركز الآغا خان الطبي.",
      "proj.ministry.title": "شراكات القطاع العام",
      "proj.ministry.text": "تتعامل مجموعة AKA مع مشافٍ تابعة لوزارة الصحة ووزارة التعليم العالي والبحث العلمي.",
      "proj.investments.eyebrow": "استثماراتنا",
      "proj.investments.title": "استثماراتنا",
      "proj.investments.text": "مشفى الرضا (دير الزور) ومشفى الحياة (دمشق).",
      "proj.investments.alridaa.name": "مشفى الرضا",
      "proj.investments.alridaa.location": "دير الزور",
      "proj.investments.alridaa.desc": "منشأة رعاية حادة حديثة ومجهّزة بالكامل تخدم المنطقة الشرقية بخدمات جراحية وتشخيصية وطوارئ شاملة.",
      "proj.investments.alhayat.name": "مشفى الحياة",
      "proj.investments.alhayat.location": "دمشق",
      "proj.investments.alhayat.desc": "مشفى متعدد التخصصات في العاصمة، مجهّز بأحدث أنظمة التصوير والجراحة والعناية المركزة.",
      "proj.cta.title": "لديك مشروع في ذهنك؟",
      "proj.cta.p": "من المشافي المتكاملة إلى قسم واحد، تستطيع مجموعة AKA تخطيطه وتجهيزه وتشغيله.",

      // ---- Values & vision (About) ----
      "about.values.title": "قيمنا ورؤيتنا",
      "about.values.lead": "قيم جوهرية توجّه جودة منتجاتنا وخدماتنا محليًا وإقليميًا.",
      "about.values.customer.title": "التركيز على العميل",
      "about.values.customer.text": "نولي الأولوية لفهم احتياجات العملاء وتلبيتها، ومعالجة المخاطر التي تؤثّر على مطابقة المنتجات والرضا.",
      "about.values.support.title": "الدعم",
      "about.values.support.text": "نوفّر الموارد والكوادر والبنية التحتية لتقديم خدمة متميّزة وبناء كفاءة الفريق.",
      "about.values.quality.title": "الجودة",
      "about.values.quality.text": "نقدّم خدمات منظّمة ومُدارة بإتقان تلبّي المعايير الحديثة وتُرضي عملاءنا.",
      "about.values.improvement.title": "التحسين المستمر",
      "about.values.improvement.text": "نتعاون مع شركاء مرموقين لتعزيز قدراتنا ودفع التطوير المستمر.",

      // ---- Timeline (About) ----
      "about.timeline.title": "مسيرتنا",
      "tl.1950": "تأسّست مجموعة AKA",
      "tl.1960": "أعمال عائلية صناعات الإنشاء",
      "tl.1962": "متاجر AKA للأقمشة",
      "tl.1997": "المناقصات وعقود الاستيراد ومحطات تنقية المياه",
      "tl.1998": "انطلاق FutureMed سوريا",
      "tl.2003": "شركة زاهر العقاد",
      "tl.2013": "انطلاق MerMed",
      "tl.2018": "FutureMed السويد",
      "tl.2025": "FutureMed ألبانيا",

      // ---- NGO partners (Agencies) ----
      "agencies.ngo.eyebrow": "شبكتنا",
      "agencies.ngo.title": "موضع ثقة كبرى المنظمات",
      "agencies.ngo.lead": "عبر قطاع المناقصات، عقدت مجموعة AKA شراكات مع كبرى المنظمات الدولية.",
      "ngo.agakhan.desc": "وكالة تنمية عالمية تعمل على تحسين نوعية الحياة من خلال مبادرات في الصحة والتعليم والاقتصاد.",
      "ngo.who.desc": "وكالة الأمم المتحدة التي تقود الصحة الدولية ضمن منظومة الأمم المتحدة، وتضع المعايير وتنسّق الاستجابات الصحية حول العالم.",
      "ngo.undp.desc": "الوكالة الرائدة للأمم المتحدة في التنمية الدولية، تساعد الدول على بناء أنظمة صحية مرنة والتعافي من الأزمات.",
      "ngo.unhcr.desc": "المفوضية السامية للأمم المتحدة لشؤون اللاجئين، توفّر معدات طبية ودعمًا صحيًا للنازحين في سوريا.",
      "ngo.imc.desc": "منظمة إنسانية عالمية تقدّم الإغاثة الطبية الطارئة والتدريب الصحي في المناطق المتأثرة بالأزمات.",

      // ---- Additional manufacturer partners ----
      "agencies.more.title": "المزيد من شركائنا",
      "partner.cisa.desc": "أنظمة تعقيم للمشافي والصناعة أكثر من 60 عامًا من خبرة التصنيع.",
      "partner.micromed.desc": "حلول الفيزيولوجيا العصبية تخطيط الدماغ والعضلات والكمونات المُثارة.",
      "partner.kasios.desc": "بدائل عظمية صناعية لجراحة العظام والأسنان.",
      "partner.aspel.desc": "أنظمة وأجهزة تخطيط قلب (ECG) عالية الجودة.",
      "partner.luxsutures.desc": "خيوط جراحية معترف بها من الجرّاحين حول العالم.",
      "partner.steelpower.desc": "معقّمات بخارية وأثاث مشافٍ من الستانلس ستيل.",
      "partner.siem.desc": "تصميم وتصنيع معدات الطوارئ الطبية.",
      "partner.item.desc": "زرعات عظمية لجراحة العظام والأعصاب العمود الفقري والقدم واليد.",
      "partner.insightra.desc": "أجهزة طبية للقلب والأوعية، منذ عام 2001.",
      "partner.sama.desc": "توريد الهيليوم والنيتروجين وتركيب وصيانة أنظمة الرنين والتصوير المقطعي.",
      "partner.elvation.desc": "شركة ألمانية رائدة في التكنولوجيا الطبية، متخصصة في أدوات وأنظمة التنظير للعمليات قليلة التداخل. تأسست عام 1906، وأصبحت اليوم منظمة عالمية تضم 18 فرعًا وأكثر من 130 موزعًا حول العالم.",
      "partner.esumedics.desc": "تعني Esumedics \"حلول طبية أوروبية مستدامة\". يتركز عملها على تطوير وتوزيع حلول طبية متينة وطويلة الأمد مصنوعة في ألمانيا، بالاستفادة من خبرة وكفاءة فريقها.",
      "partner.sternmed.desc": "شركة مصنّعة للأجهزة الطبية ومزوّدة لحلول مشاريع الرعاية الصحية الجاهزة، ومقرها في بادن-فورتمبيرغ بألمانيا. تأسست عام 2011، وتصنّع أجهزة طبية موثوقة وبأسعار مناسبة وفق معايير الجودة الألمانية لتعزيز الرعاية الصحية عالميًا.",
      "partner.perlove.desc": "شركة تقنية عالية متخصصة في تطوير وتصنيع وتوزيع أنظمة التصوير الطبي، بما فيها أجهزة الأشعة السينية وأنظمة التصوير الرقمي وأجهزة تصوير الثدي، مع تركيز خاص على مجموعة متنوعة من أجهزة C-arm.",

      // ---- Careers page ----
      "careers.hero.h1": "الوظائف في AKA",
      "careers.hero.lead":
        "انضمّ إلى فريقنا. نبحث دائمًا عن كفاءات في مجال الأجهزة الطبية والهندسة الطبية الحيوية والمبيعات والخدمة في جميع أنحاء سوريا.",
      "careers.apply.title": "قدّم الآن",
      "careers.apply.lead":
        "املأ النموذج أدناه وأرفق سيرتك الذاتية. سيراجع فريقنا طلبك ويعاود التواصل معك.",
      "careers.form.phone": "الهاتف",
      "careers.form.position": "الوظيفة المتقدّم لها",
      "careers.form.message": "رسالة تعريفية / ملاحظات",
      "careers.form.cv": "أرفق سيرتك الذاتية (PDF أو Word)",
      "careers.form.submit": "إرسال الطلب",

      // ---- About page ----
      "about.est": "تأسست عام 1998 · دمشق، سوريا",
      "about.spec.title": "مجالات تخصّصنا",
      "about.spec.1": "بيع وتوزيع الأجهزة الطبية",
      "about.spec.2": "الإصلاح وخدمة ما بعد البيع",
      "about.spec.3": "التركيب وتدريب المشغّلين",
      "about.spec.4": "إدارة المناقصات (الوطنية والدولية)",
      "about.spec.5": "إدارة المشاريع الطبية",
      "about.spec.6": "تجهيز وإدارة غرف العمليات",
      "about.spec.7": "تجهيز وإدارة العناية المركّزة",
      "about.spec.8": "تجهيز أقسام التعقيم",
      "about.hero.h1": "من نحن",
      "about.hero.lead":
        "منذ عام 1998، وفّرت AKA بشكل موثوق أجهزة ومعدات طبية معتمدة للمشافي والعيادات والمختبرات في جميع أنحاء سوريا مدعومة بالتركيب والتدريب وخدمة محلية يُعتمد عليها.",
      "about.hero.cta": "تواصل معنا",
      "about.who.title": "من نحن",
      "about.who.p":
        "تأسست مجموعة AKA (العقاد) للوكالات الطبية عام 1998 في دمشق، وتكرّس جهودها للارتقاء بالرعاية الصحية عبر تجهيزات طبية حديثة بأفضل جودة وقيمة. نوفّر أجهزة الإيكو والأدوات الجراحية ومعدات التنظير والتعقيم وأجهزة مراقبة القلب والأعصاب ومعدات المختبرات مدعومة بالتركيب والتدريب والإصلاح وخدمة ما بعد البيع الموثوقة في جميع أنحاء سوريا.",
      "about.why.title": "لماذا تختار AKA",
      "about.why.certified.title": "منتجات معتمدة",
      "about.why.certified.text":
        "معدات ومستلزمات أصلية ومعتمدة من شركات مصنّعة دولية موثوقة.",
      "about.why.local.title": "خدمة محلية",
      "about.why.local.text":
        "تركيب وتدريب وصيانة ودعم ما بعد البيع يُقدَّم ميدانيًا في سوريا.",
      "about.why.reliable.title": "شريك موثوق",
      "about.why.reliable.text":
        "سنوات من التوريد الموثوق لمقدّمي الرعاية الصحية الذين يعتمدون علينا على المدى الطويل.",
      "about.contact.title": "موقعنا والتواصل معنا",
      "about.contact.lead":
        "تواصل معنا هاتفيًا أو عبر البريد الإلكتروني، أو قم بزيارتنا — فريقنا جاهز لمساعدتك في المنتجات والمواصفات وعروض الأسعار.",
      "about.location.title": "الموقع",
      "about.phone.title": "الهاتف",
      "about.emailhours.title": "البريد وساعات العمل",
      "about.hours": "السبت – الخميس، 9:00 صباحًا – 6:00 مساءً",
      "about.cta.title": "جاهز للعمل مع AKA؟",
      "about.cta.lead":
        "أخبرنا باحتياجات منشأتك وسنعاود التواصل معك بعرض سعر مخصّص.",
      "about.cta.btn": "أرسل استفسارًا",

      // ---- Partners page ----
      "agencies.hero.h1": "شركاؤنا",
      "agencies.hero.lead":
        "تعمل AKA كشريك موثوق — تمثّل شركات التصنيع الطبية الدولية، وتتعاون مع كبرى المنظمات الإنسانية والمنظمات غير الحكومية في سوريا.",
      "agencies.hero.cta": "تعرّف على شركائنا",
      "agencies.overview.eyebrow": "ماذا نقدّم",
      "agencies.overview.title": "نظرة عامة",
      "agencies.overview.p":
        "من خلال خدمات الوكالة، تمثّل AKA الشركات المصنّعة الدولية وتورّد منها، وتتولى الشراء والاستيراد والتوزيع المحلي بحيث يتمكّن مقدّمو الرعاية الصحية في سوريا من الحصول على منتجات أصلية ومعتمدة بثقة.",
      "agencies.help.eyebrow": "كيف نعمل",
      "agencies.help.title": "كيف نساعد",
      "agencies.help.sourcing.title": "التوريد",
      "agencies.help.sourcing.text":
        "تحديد وتأمين المنتجات المناسبة من شركات مصنّعة موثوقة.",
      "agencies.help.import.title": "الاستيراد والخدمات اللوجستية",
      "agencies.help.import.text":
        "إدارة الشراء والشحن والتخليص الجمركي إلى سوريا.",
      "agencies.help.dist.title": "التوزيع المحلي",
      "agencies.help.dist.text":
        "التوصيل والتركيب ودعم ما بعد البيع ميدانيًا.",
      "agencies.cta.title": "تبحث عن شريك؟",
      "agencies.cta.p":
        "تواصل معنا لمناقشة التمثيل أو التوريد أو التوزيع.",
      "agencies.cta.btn": "تواصل معنا",

      // ---- Agencies: partner brands ----
      "agencies.partners.eyebrow": "الشركات المصنّعة",
      "agencies.partners.title": "وكلاؤنا",
      "agencies.partners.lead":
        "AKA هي الوكيل المعتمد في سوريا لكبرى الشركات العالمية المصنّعة للأجهزة الطبية.",
      "partner.visit": "زيارة الموقع",
      "partner.edan.desc":
        "مراقبة المرضى وتخطيط القلب والإيكو وفحوص نقطة الرعاية وحلول الأمومة والأجنّة.",
      "partner.neurowerk.desc":
        "أنظمة تشخيص عصبية تخطيط الدماغ والعضلات والكمونات المُثارة.",
      "partner.custo.desc":
        "تشخيص قلبي رئوي — تخطيط قلب بالراحة والجهد ومراقبة هولتر وقياس التنفّس.",
      "partner.ems.desc":
        "أجهزة سويسرية دقيقة لتفتيت حصى المسالك البولية والوقاية السنّية والعلاج بالموجات الصدمية.",
      "partner.merivaara.desc":
        "طاولات عمليات وإضاءة جراحية وحلول لغرف العمليات والعناية المركّزة.",
      "partner.neusoft.desc":
        "أنظمة تصوير تشخيصي التصوير المقطعي والرنين المغناطيسي والأشعة والإيكو.",
      "partner.hermann.desc":
        "شركة ألمانية لتصنيع الأدوات الجراحية والزرعات تنظير البطن والتنظير والجراحة الكهربائية وتنظير المفاصل.",
      "partner.emos.desc":
        "شركة ألمانية لتصنيع مناظير صلبة ومرنة عالية الجودة للجراحة والأنف والأذن والمسالك البولية والجهاز الهضمي.",
      "partner.imo.desc":
        "أسرّة وأثاث للعناية المركّزة والمشافي.",

      // ---- Devices page ----
      "devices.hero.h1": "الأجهزة",
      "devices.hero.lead":
        "تصفّح أجهزتنا الطبية حسب الاستخدام السريري. توفّر AKA معدات معتمدة للتشخيص والمراقبة والجراحة ورعاية المشافي كلٌّ منها مدعوم بالتركيب والتدريب والدعم المحلي.",
      "devices.hero.cta": "تصفّح الفئات",
      "devices.portfolio.eyebrow": "كتالوجنا",
      "devices.portfolio.title": "مجموعة أجهزة معتمدة",
      "devices.portfolio.p":
        "كل جهاز تقدّمه AKA يُختار من أجل الموثوقية وسهولة الاستخدام والامتثال لمعايير الجودة الدولية. من الوحدات الصغيرة بجانب السرير إلى التجهيزات الكاملة للمشافي، نساعد مقدّمي الرعاية الصحية في سوريا على تجهيز منشآتهم بثقة وإبقائها تعمل عبر الصيانة وقطع الغيار وخدمة ما بعد البيع الموثوقة.",
      "devices.process.eyebrow": "كيف نعمل",
      "devices.process.title": "من الاستفسار إلى التركيب",
      "devices.process.step1": "الاستفسار",
      "devices.process.step2": "عرض السعر",
      "devices.process.step3": "التوريد",
      "devices.process.step4": "التركيب",
      "devices.process.step5": "التدريب والدعم",
      "devices.featured.eyebrow": "في مجموعتنا",
      "devices.featured.title": "أجهزة مميّزة",
      "devices.video.label": "شاهد: التركيب والتدريب",
      "devices.docs.eyebrow": "الوثائق",
      "devices.docs.title": "وثائق الأجهزة لسوريا",
      "devices.docs.btn": "عرض التفاصيل",
      "devices.docs.p1":
        "اطّلع على الملفات التقنية وأدلة الاستخدام وملاحظات التوافق ومعلومات السلامة لكل جهاز طبي توردّه AKA في سوريا — بما في ذلك متطلبات التركيب والمراجع التنظيمية السورية للمهندسين الطبيين وفرق المشافي والموزّعين.",
      "devices.docs.p2":
        "تحقّق ممّا إذا كان كل جهاز مناسبًا لمنشأتك، مع جداول توافق واضحة ومعايير الطاقة والشبكات في سوريا، ووثائق جاهزة للمناقصات والتدقيق وعمليات تفتيش وزارة الصحة.",

      // ---- Supplements page ----
      "supp.hero.h1": "المكمّلات",
      "supp.hero.lead":
        "مكمّلات غذائية ومستلزمات عالية الجودة للصيدليات والعيادات ومقدّمي الرعاية الصحية في جميع أنحاء سوريا.",
      "supp.hero.cta": "اطلب عرض سعر",
      "supp.overview.title": "نظرة عامة",
      "supp.overview.p":
        "توفّر AKA مجموعة من المكمّلات الغذائية والمستلزمات الصحية، يتم توريدها بجودة وثبات عاليين.",
      "supp.offer.title": "ماذا نقدّم",
      "supp.offer.vitamins.title": "الفيتامينات والمعادن",
      "supp.offer.vitamins.text":
        "مكمّلات غذائية أساسية للاحتياجات اليومية والسريرية.",
      "supp.offer.specialty.title": "تركيبات متخصّصة",
      "supp.offer.specialty.text":
        "مكمّلات موجّهة لمتطلبات غذائية وعلاجية محدّدة.",
      "supp.offer.consumables.title": "المستلزمات",
      "supp.offer.consumables.text":
        "مستلزمات صحية موثوقة للصيدليات ومقدّمي الخدمات.",
      "supp.cta.title": "مهتمّ بمكمّلاتنا؟",
      "supp.cta.p":
        "تواصل مع AKA للحصول على قائمة المنتجات الكاملة وعرض سعر مخصّص.",
      "supp.cta.btn": "اطلب عرض سعر",

      // ---- Support page ----
      "support.hero.h1": "خدماتنا",
      "support.hero.lead":
        "وثائق تقنية وتركيب وتدريب وخدمة ما بعد بيع موثوقة لكل جهاز توردّه AKA في سوريا.",
      "support.hero.cta": "تواصل مع الدعم",
      "support.how.title": "كيف ندعمك",
      "support.doc.title": "الوثائق",
      "support.doc.text":
        "أدلة الاستخدام والملفات التقنية وملاحظات التوافق ومعلومات السلامة — مع مراجع تنظيمية سورية للمناقصات والتدقيق وعمليات تفتيش وزارة الصحة.",
      "support.install.title": "التركيب",
      "support.install.text":
        "تركيب وتشغيل في الموقع على يد فنيين مدرّبين، مع معايير طاقة وشبكات مناسبة لسوريا.",
      "support.training.title": "التدريب",
      "support.training.text":
        "تدريب عملي للكوادر السريرية والطبية الحيوية ليتمكّن فريقك من تشغيل المعدات بأمان وفعالية.",
      "support.maint.title": "الصيانة وقطع الغيار",
      "support.maint.text":
        "صيانة وقائية وإصلاحات وقطع غيار لإبقاء معداتك تعمل.",
      "support.cta.title": "تحتاج مساعدة بخصوص جهاز؟",
      "support.cta.lead":
        "فريقنا جاهز لمساعدتك في الوثائق والخدمة وقطع الغيار.",
      "support.cta.btn": "راسل الدعم",

      // ---- Categories (merged into Devices page) ----
      "cat.eyebrow": "تصفّح حسب الفئة",
      "cat.title": "الفئات",
      "cat.diagnostic": "أجهزة التشخيص",
      "cat.monitoring": "مراقبة المرضى",
      "cat.respiratory": "العناية التنفسية",
      "cat.cardiology": "أمراض القلب",
      "cat.hospital": "معدات المشافي",
      "cat.surgical": "المعدات الجراحية",
      "cat.imaging": "التصوير والإيكو",
      "cat.lab": "معدات المختبرات",
      "cat.endoscopy": "التنظير",
      "cat.sterilization": "التعقيم (CSSD)",
      "cat.neurology": "طب الأعصاب",
      "cat.orthopedics": "جراحة العظام",

      // ---- Neurology page ----
      "neuro.lead":
        "معدات فيزيولوجيا عصبية معتمدة للمشافي والعيادات في سوريا — توريد وخدمة AKA.",
      "neuro.overview":
        "تدعم معدات طب الأعصاب تشخيص ومراقبة الحالات العصبية. توفّر AKA أنظمة تخطيط الدماغ (EEG) والعضلات (EMG) والكمونات المُثارة، تُختار للدقة والموثوقية وتُدعم بالتركيب والتدريب والدعم التقني المحلي.",
      "neuro.o1t": "أنظمة تخطيط الدماغ (EEG)",
      "neuro.o1d": "أنظمة تخطيط كهربية الدماغ لتشخيص الاضطرابات العصبية والنوبات.",
      "neuro.o2t": "تخطيط العضلات وسرعة التوصيل العصبي",
      "neuro.o2d": "فحوص تخطيط كهربية العضلات وسرعة التوصيل العصبي لتقييم الجهاز العصبي العضلي.",
      "neuro.o3t": "الكمونات المُثارة",
      "neuro.o3d": "أنظمة الكمونات المُثارة لتقييم وظيفة المسارات الحسية والعصبية.",

      // ---- Orthopedics page ----
      "ortho.lead":
        "زرعات عظمية وحلول جراحية معتمدة للمشافي والعيادات في سوريا — توريد وخدمة AKA.",
      "ortho.overview":
        "تدعم حلول جراحة العظام عمليات العظام والمفاصل بمنتجات معتمدة وموثوقة. توفّر AKA بدائل العظام وزرعات العمود الفقري والقدم واليد، تُختار للسلامة والدقة الجراحية وتُدعم بالتركيب والتدريب والدعم التقني المحلي.",
      "ortho.o1t": "بدائل العظام",
      "ortho.o1d": "بدائل عظمية صناعية لجراحة العظام والأسنان.",
      "ortho.o2t": "زرعات العمود الفقري",
      "ortho.o2d": "زرعات وأدوات لجراحة العمود الفقري والأعصاب.",
      "ortho.o3t": "زرعات القدم واليد",
      "ortho.o3d": "زرعات لجراحة الأطراف — القدم والكاحل واليد.",

      // ---- Diagnostic Devices page ----
      "diag.hero.h1": "أجهزة التشخيص",
      "diag.hero.lead":
        "أجهزة تشخيص دقيقة وموثوقة للمشافي والعيادات والمختبرات في جميع أنحاء سوريا — يتم توريدها وتركيبها وصيانتها من قبل AKA.",
      "diag.overview.title": "نظرة عامة",
      "diag.overview.p":
        "تشكّل أجهزة التشخيص أساس اتخاذ القرارات السريرية الدقيقة. توفّر AKA مجموعة واسعة من أجهزة التشخيص المعتمدة التي تساعد مقدّمي الرعاية الصحية في سوريا على اكتشاف حالات المرضى وقياسها ومراقبتها بثقة. كل جهاز نقدّمه يُختار من أجل الموثوقية وسهولة الاستخدام والامتثال لمعايير الجودة الدولية، ومدعوم بالتركيب والتدريب والدعم التقني المستمر محليًا.",
      "diag.offer.title": "ماذا نقدّم",
      "diag.offer.ivd.title": "التشخيص المخبري (In-vitro)",
      "diag.offer.ivd.text":
        "أجهزة تحليل وعدّات اختبار لتحليل عيّنات الدم والبول والمختبر.",
      "diag.offer.poc.title": "اختبارات نقطة الرعاية",
      "diag.offer.poc.text":
        "أجهزة صغيرة لنتائج سريعة بجانب السرير في العيادات وحالات الطوارئ.",
      "diag.offer.measure.title": "القياس والمراقبة",
      "diag.offer.measure.text":
        "أدوات لقياس المؤشرات الحيوية ودعم التشخيص الروتيني.",
      "diag.why.title": "لماذا الشراء من AKA",
      "diag.why.certified.title": "منتجات معتمدة",
      "diag.why.certified.text":
        "أجهزة أصلية تستوفي معايير الجودة والسلامة الدولية.",
      "diag.why.install.title": "التركيب والإعداد",
      "diag.why.install.text":
        "تركيب وتشغيل في الموقع على يد فنيين مدرّبين.",
      "diag.why.training.title": "التدريب",
      "diag.why.training.text":
        "تدريب عملي لكوادرك السريرية والطبية الحيوية.",
      "diag.why.service.title": "الخدمة والدعم",
      "diag.why.service.text":
        "صيانة وقطع غيار ودعم ما بعد البيع المحلي الموثوق.",
      "diag.cta.title": "مهتمّ بأجهزة التشخيص لدينا؟",
      "diag.cta.p":
        "تواصل مع AKA للحصول على تفاصيل المنتجات والمواصفات وعرض سعر مخصّص لمنشأتك.",
      "diag.cta.btn": "اطلب عرض سعر",

      // ---- Shared category-page CTA ----
      "catpage.cta.title": "مهتمّ بهذه الفئة؟",
      "catpage.cta.p":
        "تواصل مع AKA للحصول على تفاصيل المنتجات والمواصفات وعرض سعر مخصّص لمنشأتك.",
      "catpage.cta.btn": "اطلب عرض سعر",

      // ---- Endoscopy ----
      "endo.lead":
        "أنظمة وأدوات تنظير للاستخدام التشخيصي والجراحي في المشافي والعيادات في سوريا — توردها وتركّبها وتصونها AKA.",
      "endo.overview":
        "يتيح التنظير تشخيصًا وعلاجًا بأقل تدخّل جراحي. توفّر AKA أنظمة تنظير ومناظير وملحقات معتمدة — مختارة لجودة الصورة والموثوقية ومدعومة بالتركيب والتدريب والدعم التقني محليًا.",
      "endo.o1t": "أبراج التنظير",
      "endo.o1d": "كاميرات ومصادر إضاءة ومعالجات لغرف العمليات وجناح التنظير.",
      "endo.o2t": "مناظير صلبة ومرنة",
      "endo.o2d": "مناظير للعمليات الجراحية والهضمية والأنف والأذن والمسالك.",
      "endo.o3t": "الأدوات والملحقات",
      "endo.o3d": "أدوات تنظير وملحقات ومستلزمات.",

      // ---- Sterilization (CSSD) ----
      "steril.lead":
        "معدات تعقيم وأقسام تعقيم مركزية (CSSD) للمشافي والمراكز الجراحية في سوريا توردها وتركّبها وتصونها AKA.",
      "steril.overview":
        "يحمي التعقيم الموثوق المرضى والكوادر. توفّر AKA أجهزة تعقيم وغسّالات-مطهّرات ومعدات CSSD معتمدة، مختارة للأمان والمطابقة ومدعومة بالتركيب والتدريب والخدمة محليًا. كما نساعد في تخطيط وتجهيز أقسام تعقيم متكاملة.",
      "steril.o1t": "أجهزة التعقيم (الأوتوكلاف)",
      "steril.o1d": "معقّمات بالبخار وبدرجات حرارة منخفضة لكل الأحجام.",
      "steril.o2t": "غسّالات-مطهّرات",
      "steril.o2d": "تنظيف وتطهير آلي للأدوات.",
      "steril.o3t": "تخطيط أقسام التعقيم",
      "steril.o3d": "تصميم القسم وسير العمل والتجهيز للتعقيم المركزي.",

      // ---- Patient Monitoring ----
      "mon.lead":
        "مراقبة مستمرة ودقيقة للعلامات الحيوية للعناية الحرجة وغرف العمليات والأقسام العامة في سوريا — توردها وتصونها AKA.",
      "mon.overview":
        "توفّر أنظمة مراقبة المرضى للأطباء صورة لحظية عن حالة المريض. توفّر AKA حلول مراقبة معتمدة بجانب السرير ومركزية — من وحدات العلامات الحيوية الصغيرة إلى شاشات العناية المركّزة متعددة المؤشرات — مختارة للدقة والموثوقية وسهولة الاستخدام، ومدعومة بالتركيب والتدريب والدعم التقني محليًا.",
      "mon.o1t": "شاشات بجانب السرير",
      "mon.o1d": "شاشات متعددة المؤشرات للعناية المركّزة والقلبية وغرف العمليات.",
      "mon.o2t": "شاشات العلامات الحيوية",
      "mon.o2d": "أجهزة فحص سريع صغيرة للأقسام والعيادات الخارجية.",
      "mon.o3t": "المحطات المركزية",
      "mon.o3d": "مراقبة مركزية مترابطة لأقسام كاملة.",

      // ---- Respiratory Care ----
      "resp.lead":
        "أجهزة تنفّس وتهوية موثوقة للمشافي والعيادات والرعاية الإسعافية في سوريا — توردها وتصونها AKA.",
      "resp.overview":
        "تدعم أجهزة العناية التنفسية المرضى الذين يحتاجون مساعدة على التنفّس، من الحالات الإسعافية إلى الرعاية طويلة الأمد. توفّر AKA أجهزة تهوية ومعالجة بالأكسجين وإدارة مجرى الهواء معتمدة، مختارة للأمان والموثوقية ومدعومة بالتركيب والتدريب والخدمة محليًا.",
      "resp.o1t": "أجهزة التهوية",
      "resp.o1d": "تهوية باضعة وغير باضعة للعناية المركّزة والطوارئ.",
      "resp.o2t": "العلاج بالأكسجين",
      "resp.o2d": "مولّدات أكسجين ومقاييس تدفّق وأنظمة توصيل أكسجين.",
      "resp.o3t": "إدارة مجرى الهواء",
      "resp.o3d": "أجهزة إرذاذ وشفط ومستلزمات تنفّسية.",

      // ---- Cardiology ----
      "card.lead":
        "أجهزة تشخيص ومراقبة قلبية معتمدة للمشافي والعيادات في سوريا — توردها وتصونها AKA.",
      "card.overview":
        "تساعد أجهزة أمراض القلب على اكتشاف حالات القلب ومراقبتها وإدارتها. توفّر AKA أجهزة تخطيط قلب وإنعاش ومراقبة قلبية معتمدة، مختارة للدقة والموثوقية ومدعومة بالتركيب والتدريب والدعم التقني محليًا.",
      "card.o1t": "أجهزة تخطيط القلب",
      "card.o1d": "أنظمة تخطيط قلب بالراحة والجهد للتشخيص والفحص.",
      "card.o2t": "أجهزة الصدمات الكهربائية",
      "card.o2d": "مزيلات رجفان يدوية وآلية خارجية (AED).",
      "card.o3t": "المراقبة القلبية",
      "card.o3d": "حلول مراقبة قلبية من نوع هولتر وبجانب السرير.",

      // ---- Hospital Equipment ----
      "hosp.lead":
        "معدات مشافي وأقسام متينة للمنشآت الصحية في سوريا — توردها وتركّبها وتصونها AKA.",
      "hosp.overview":
        "من أسرّة المرضى إلى أثاث الأقسام ومعدات التنقّل، توفّر AKA البنية الأساسية التي تُبقي المشافي والعيادات تعمل. كل عنصر مختار للمتانة والأمان ومدعوم بالتوصيل والتركيب ودعم ما بعد البيع محليًا.",
      "hosp.o1t": "أسرّة المشافي",
      "hosp.o1d": "أسرّة يدوية وكهربائية للأقسام والعناية المركّزة والإفاقة.",
      "hosp.o2t": "أثاث الأقسام",
      "hosp.o2d": "عربات وخزائن وطاولات فحص ونقّالات.",
      "hosp.o3t": "التنقّل والنقل",
      "hosp.o3d": "كراسي متحرّكة ورافعات مرضى ووسائل نقل.",

      // ---- Surgical Equipment ----
      "surg.lead":
        "أدوات جراحية ومعدات غرف عمليات معتمدة للمشافي في سوريا — توردها وتصونها AKA.",
      "surg.overview":
        "يجب أن تعمل المعدات الجراحية بلا أخطاء تحت الضغط. توفّر AKA معدات غرف عمليات ووحدات جراحة كهربائية وأدوات معتمدة، مختارة للدقة والموثوقية ومدعومة بالتركيب والتدريب والخدمة محليًا.",
      "surg.o1t": "طاولات وإضاءة العمليات",
      "surg.o1d": "طاولات جراحية وإضاءة وبنية غرف العمليات.",
      "surg.o2t": "الجراحة الكهربائية",
      "surg.o2d": "أنظمة جراحية كهربائية وقائمة على الطاقة.",
      "surg.o3t": "الأدوات الجراحية",
      "surg.o3d": "أطقم أدوات عالية الجودة لمجموعة من العمليات.",

      // ---- Medical Imaging ----
      "imag.lead":
        "أنظمة تصوير تشخيصي للمشافي والعيادات ومراكز الأشعة في سوريا — توردها وتركّبها وتصونها AKA.",
      "imag.overview":
        "التصوير الطبي أساسي للتشخيص الدقيق. توفّر AKA أنظمة تصوير معتمدة — من الأشعة السينية والإيكو إلى الأنماط المتخصّصة — مختارة لجودة الصورة والموثوقية ومدعومة بالتركيب والتدريب والدعم التقني محليًا.",
      "imag.o1t": "أنظمة الأشعة السينية",
      "imag.o1d": "تصوير شعاعي ثابت ومتنقّل للمشافي والعيادات.",
      "imag.o2t": "الإيكو (الأمواج فوق الصوتية)",
      "imag.o2d": "تصوير بالأمواج فوق الصوتية للأشعة والنسائية ونقطة الرعاية.",
      "imag.o3t": "ملحقات التصوير",
      "imag.o3d": "عارضات وطابعات ومستلزمات تصوير.",

      // ---- Laboratory Equipment ----
      "lab.lead":
        "أجهزة تحليل ومعدات مختبرية معتمدة للمشافي والعيادات والمختبرات في سوريا — توردها وتصونها AKA.",
      "lab.overview":
        "تعتمد دقة الفحوص على معدات مختبرية موثوقة. توفّر AKA أجهزة تحليل وأجهزة طرد مركزي وأدوات مختبرية معتمدة، مختارة للدقة والمتانة ومدعومة بالتركيب والتدريب والدعم المستمر محليًا.",
      "lab.o1t": "أجهزة التحليل",
      "lab.o1d": "أجهزة تحليل أمراض الدم والكيمياء الحيوية والمناعة.",
      "lab.o2t": "معدات مختبرية عامة",
      "lab.o2d": "أجهزة طرد مركزي ومجاهر وحاضنات وغيرها.",
      "lab.o3t": "الكواشف والمستلزمات",
      "lab.o3d": "عدّات اختبار ومستلزمات للعمل المختبري الروتيني.",

      // ---- Dental Equipment ----
      "dent.lead":
        "معدات أسنان متكاملة للعيادات والمراكز في سوريا — توردها وتركّبها وتصونها AKA.",
      "dent.overview":
        "توفّر AKA معدات أسنان معتمدة لعيادات بمختلف الأحجام — من كراسي ووحدات الأسنان إلى التصوير والقطع اليدوية — مختارة للموثوقية وراحة المريض ومدعومة بالتركيب والتدريب والخدمة محليًا.",
      "dent.o1t": "كراسي ووحدات الأسنان",
      "dent.o1d": "وحدات علاج متكاملة للممارسة العامة والمتخصّصة.",
      "dent.o2t": "تصوير الأسنان",
      "dent.o2d": "أنظمة أشعة داخل الفم وبانورامية.",
      "dent.o3t": "الأدوات والمستلزمات",
      "dent.o3d": "قطع يدوية وأدوات ومستلزمات عيادات.",

      // ---- Consumables & Supplies ----
      "cons.lead":
        "مستلزمات ومواد طبية يومية موثوقة للمشافي والعيادات والصيدليات في سوريا — توردها AKA.",
      "cons.overview":
        "تعتمد الرعاية اليومية على إمداد ثابت بمستلزمات عالية الجودة. توفّر AKA مواد قابلة للتصرّف ومنتجات مكافحة عدوى ومستلزمات طبية معتمدة، يتم توريدها بجودة وثبات وتوصيلها بموثوقية في جميع أنحاء سوريا.",
      "cons.o1t": "المواد القابلة للتصرّف",
      "cons.o1d": "محاقن وقفازات وضمادات ومستلزمات أحادية الاستخدام.",
      "cons.o2t": "مكافحة العدوى",
      "cons.o2d": "معدات حماية شخصية وتعقيم ومنتجات نظافة.",
      "cons.o3t": "المستلزمات الطبية",
      "cons.o3d": "مستلزمات يومية للأقسام والعيادات والمختبرات.",

      // ---- Gynecology & Obstetrics ----
      "gyn.lead":
        "معدات لصحة المرأة ورعاية الأمومة والولادة في سوريا — توردها وتركّبها وتصونها AKA.",
      "gyn.overview":
        "توفّر AKA معدات نسائية وتوليدية معتمدة للعيادات ووحدات الأمومة — من الفحص والإيكو إلى الولادة ورعاية حديثي الولادة — مختارة للأمان والموثوقية ومدعومة بالتركيب والتدريب والخدمة محليًا.",
      "gyn.o1t": "الإيكو والتشخيص",
      "gyn.o1d": "إيكو نسائي وتوليدي ومعدات فحص.",
      "gyn.o2t": "الولادة والأمومة",
      "gyn.o2d": "أسرّة ولادة وطاولات فحص ومعدات أمومة.",
      "gyn.o3t": "رعاية حديثي الولادة",
      "gyn.o3d": "مدافئ أطفال وحاضنات ووحدات معالجة ضوئية.",

      // ---- Urology ----
      "uro.lead":
        "معدات تشخيص وعلاج مسالك بولية للمشافي والعيادات في سوريا — توردها وتصونها AKA.",
      "uro.overview":
        "توفّر AKA معدات مسالك بولية معتمدة للتشخيص والعلاج — من التنظير والإيكو إلى تفتيت الحصى والمستلزمات — مختارة للموثوقية ومدعومة بالتركيب والتدريب والدعم التقني محليًا.",
      "uro.o1t": "التنظير",
      "uro.o1d": "مناظير مثانة وأنظمة تنظير للمسالك البولية.",
      "uro.o2t": "التشخيص",
      "uro.o2d": "أنظمة ديناميكا بولية وإيكو للتقييم.",
      "uro.o3t": "العلاج والمستلزمات",
      "uro.o3d": "دعم تفتيت الحصى ومستلزمات المسالك البولية.",
    },
  };

  function t(key, lang) {
    const l = lang || getLang();
    return (dict[l] && dict[l][key]) || (dict.en && dict.en[key]) || key;
  }

  function getLang() {
    // Default to Arabic for first-time visitors (no saved choice yet).
    return localStorage.getItem(STORAGE_KEY) || "ar";
  }

  // Apply the chosen language to the whole document.
  function apply(lang) {
    const l = lang || getLang();
    const isAr = l === "ar";

    document.documentElement.lang = l;
    document.documentElement.dir = isAr ? "rtl" : "ltr";

    // Load the Arabic webfont on demand the first time it's needed.
    if (isAr) ensureArabicFont();

    // Text content
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"), l);
    });

    // Attributes, e.g. data-i18n-attr="placeholder:form.name"
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.getAttribute("data-i18n-attr")
        .split(",")
        .forEach((pair) => {
          const [attr, key] = pair.split(":").map((s) => s.trim());
          if (attr && key) el.setAttribute(attr, t(key, l));
        });
    });
  }

  function set(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    apply(lang);
  }

  function toggle() {
    set(getLang() === "ar" ? "en" : "ar");
  }

  // Inject the Cairo Arabic font once.
  function ensureArabicFont() {
    if (document.getElementById("aka-ar-font")) return;
    const link = document.createElement("link");
    link.id = "aka-ar-font";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700&display=swap";
    document.head.appendChild(link);
  }

  return { t, apply, set, toggle, getLang };
})();
