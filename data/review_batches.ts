// Organized word sets based on review_script_natural.txt and review_script_new_batch.txt
// Each set contains exactly 10 words in order from the script files

export const SET_BATCHES: string[][] = [
    // Set 1 (Lines 1-10 of review_script_natural.txt)
    ["Bard", "Berate", "Brash", "Concoct", "Daft", "Dearth", "Desolate", "Dynamic", "Excursion", "Fabricate"],

    // Set 2 (Lines 11-20)
    ["Flattery", "Forage", "Gregarious", "Incessant", "Innate", "Innocuous", "Inundate", "Abate", "Abhor", "Abhorrent"],

    // Set 3 (Lines 21-30)
    ["Aggregate", "Allay", "Aloof", "Amoral", "Amorous", "Apartheid", "Apathy", "Ascertain", "Atone", "Augment"],

    // Set 4 (Lines 31-40)
    ["Brazen", "Buffet (verb)", "Burgeon", "Cajole", "Camaraderie", "Cavort", "Chastise", "Commendable", "Compel", "Concede"],

    // Set 5 (Lines 41-50)
    ["Confound", "Cosmopolitan", "Cursory", "Dilapidated", "Diminutive", "Disparity", "Dissipate", "Dissociate", "Divisive", "Domicile"],

    // Set 6 (Lines 51-60)
    ["Entomology", "Erroneous", "Feign", "Fickle", "Forlorn", "Forsake", "Fortitude", "Gluttonous", "Grandiose", "Grotto"],

    // Set 7 (Lines 61-70)
    ["Hapless", "Harrowing", "Henchman", "Impudent", "Inclement", "Indignation", "Infuse", "Bide", "Douse", "Gape"],

    // Set 8 (Lines 71-80)
    ["Hail", "Abrogate", "Abscond", "Accede", "Acumen", "Aggrandize", "Akimbo", "Alacrity", "Algid", "Amalgamation"],

    // Set 9 (Lines 81-90)
    ["Ameliorate", "Amorphous", "Anachronism", "Antechamber", "Aphorism", "Apparitional", "Ascetic", "Assuage", "Austere", "Baleful"],

    // Set 10 (Lines 91-100)
    ["Bereft", "Bilk", "Blandish", "Bourgeois", "Brumal", "Brusque", "Cacophony", "Cadence", "Calumny", "Capricious"],

    // Set 11 (Lines 101-110)
    ["Carouse", "Circumlocution", "Circumspect", "Clairvoyant", "Coalesce", "Cogent", "Collusion", "Comatose", "Commodious", "Complicit"],

    // Set 12 (Lines 111-120)
    ["Conciliatory", "Concord", "Confluence", "Contusion", "Convalescence", "Corpulent", "Credulity", "Derelict", "Diaphanous", "Disparage"],

    // Set 13 (Lines 121-130)
    ["Disparate", "Dissonance", "Doppelganger", "Elegy", "Elocution", "Elucidate", "Enervate", "Enervated", "Espouse", "Espy"],

    // Set 14 (Lines 131-140)
    ["Ethereal", "Exacerbate", "Exigent", "Existential", "Exorbitant", "Extol", "Fabulist", "Facile", "Fallacious", "Fatuous"],

    // Set 15 (Lines 141-150)
    ["Fecund", "Fetter", "Fey", "Firmament", "Flaccid", "Flout", "Forestall", "Fortuitous", "Frenetic", "Glib"],

    // Set 16 (Lines 151-160)
    ["Goad", "Gourmand", "Guile", "Hedonist", "Hiatus", "Hiemal", "Histrionic", "Idolatrous", "Illusory", "Immutable"],

    // Set 17 (Lines 161-171 - last line of review_script_natural.txt)
    ["Impecunious", "Impervious", "Incisive", "Indictment", "Inextricable", "Inimical", "Iniquity", "Inquisitor", "Invective", "Inveterate"],

    // ====== review_script_new_batch.txt starts here (Line 1 = Set 18) ======

    // Set 18 (Lines 1-10 of review_script_new_batch.txt)
    ["Jaunt", "Jocular", "Kindle", "Lament", "Lavish", "Lax", "Meager", "Mundane", "Naive", "Orator"],

    // Set 19 (Lines 11-20)
    ["Pacify", "Palatable", "Parody", "Perceptive", "Philanthropy", "Placid", "Pristine", "Quaint", "Rapport", "Rash"],

    // Set 20 (Lines 21-30)
    ["Recluse", "Rectify", "Refurbish", "Rejuvenate", "Relish", "Sedentary", "Tangible", "Thrifty", "Tranquil", "Vigilant"],

    // Set 21 (Lines 31-40)
    ["Virtuoso", "Vitality", "Vivacious", "Wary", "Itinerant", "Jaded", "Jargon", "Jettison", "Judicious", "Labyrinth"],

    // Set 22 (Lines 41-50)
    ["Languid", "Latent", "Lethargic", "Lucid", "Malleable", "Manifest", "Mediate", "Meticulous", "Morose", "Narcissist"],

    // Set 23 (Lines 51-60)
    ["Negligent", "Nomadic", "Nominal", "Oblivious", "Obsolete", "Obstinate", "Obtrusive", "Odious", "Opaque", "Ornate"],

    // Set 24 (Lines 61-70)
    ["Oscillate", "Paramount", "Partisan", "Penchant", "Pensive", "Pertinent", "Pervasive", "Petulant", "Placate", "Plethora"],

    // Set 25 (Lines 71-80)
    ["Pliant", "Pragmatic", "Precarious", "Precursor", "Pretentious", "Prevalent", "Profuse", "Provincial", "Punitive", "Quell"],

    // Set 26 (Lines 81-90)
    ["Raucous", "Rebuke", "Reciprocate", "Reiterate", "Relinquish", "Reproach", "Resolute", "Revel", "Revere", "Rotund"],

    // Set 27 (Lines 91-100)
    ["Satiate", "Scrupulous", "Scrutinize", "Serendipity", "Sobriety", "Stagnate", "Stoic", "Strenuous", "Substantiate", "Succinct"],

    // Set 28 (Lines 101-110)
    ["Surly", "Surrogate", "Tenacious", "Terrestrial", "Translucent", "Uncanny", "Undulate", "Valor", "Veneer", "Venerate"],

    // Set 29 (Lines 111-120)
    ["Vindicate", "Vocation", "Volatile", "Voluminous", "Voracious", "Wane", "Wayward", "Whimsical", "Wrath", "Zealous"],

    // Set 30 (Lines 121-130)
    ["Juxtaposition", "Kismet", "Knell", "Lampoon", "Lassitude", "Laud", "Levity", "Loquacious", "Magnanimous", "Maudlin"],

    // Set 31 (Lines 131-140)
    ["Maverick", "Mellifluous", "Mendacious", "Mercurial", "Modicum", "Mollify", "Munificent", "Nadir", "Nascent", "Nebulous"],

    // Set 32 (Lines 141-150)
    ["Nefarious", "Neophyte", "Noxious", "Nuance", "Obdurate", "Obfuscate", "Obsequious", "Obtuse", "Obviate", "Officious"],

    // Set 33 (Lines 151-160)
    ["Opulent", "Orthodox", "Ostentatious", "Ostracize", "Palliate", "Panacea", "Paradigm", "Paragon", "Pariah", "Parsimonious"],

    // Set 34 (Lines 161-170)
    ["Pathos", "Paucity", "Pedantic", "Pejorative", "Penitent", "Penury", "Perfunctory", "Pernicious", "Perspicacity", "Peruse"],

    // Set 35 (Lines 171-180)
    ["Phlegmatic", "Platitude", "Poignant", "Polemic", "Preclude", "Precocious", "Predilection", "Presumptuous", "Probity", "Proclivity"],

    // Set 36 (Lines 181-190)
    ["Prodigal", "Prodigious", "Profane", "Profligate", "Propensity", "Propitious", "Prosaic", "Protean", "Puerile", "Pugnacious"],

    // Set 37 (Lines 191-200)
    ["Pulchritude", "Quandary", "Querulous", "Quiescent", "Quixotic", "Quotidian", "Rancor", "Raze", "Recalcitrant", "Recapitulate"],

    // Set 38 (Lines 201-210)
    ["Redoubtable", "Refractory", "Remiss", "Remuneration", "Renounce", "Replete", "Reprehensible", "Reprieve", "Repudiate", "Repugnant"],

    // Set 39 (Lines 211-220)
    ["Rescind", "Respite", "Resplendent", "Restive", "Reticent", "Revile", "Rhapsodize", "Rhetoric", "Rife", "Rostrum"],

    // Set 40 (Lines 221-230)
    ["Ruminate", "Sacrosanct", "Sagacious", "Salient", "Salubrious", "Sanctimonious", "Sanguine", "Scathing", "Scurrilous", "Seminal"],

    // Set 41 (Lines 231-240)
    ["Servile", "Sinuous", "Solicitous", "Soliloquy", "Solipsistic", "Somnolent", "Sophomoric", "Soporific", "Specious", "Spurious"],

    // Set 42 (Lines 241-250)
    ["Staid", "Stolid", "Strident", "Stupefy", "Subjugate", "Sublime", "Subterfuge", "Superfluous", "Surfeit", "Surmise"],

    // Set 43 (Lines 251-260)
    ["Surreptitious", "Sycophant", "Symbiotic", "Tacit", "Taciturn", "Tangential", "Tantamount", "Temerity", "Temperance", "Tenable"],

    // Set 44 (Lines 261-270)
    ["Tenuous", "Terse", "Timorous", "Tirade", "Toady", "Tome", "Torpid", "Tortuous", "Tractable", "Transgress"],

    // Set 45 (Lines 271-280)
    ["Transient", "Trepidation", "Trite", "Truculent", "Truncate", "Turpitude", "Ubiquitous", "Umbrage", "Unconscionable", "Unctuous"],

    // Set 46 (Lines 281-290)
    ["Upbraid", "Usurp", "Utilitarian", "Vacillate", "Vacuous", "Vagary", "Vapid", "Variegated", "Vehement", "Venerable"],

    // Set 47 (Lines 291-300)
    ["Veracity", "Verbose", "Verdant", "Veritable", "Vernacular", "Vestige", "Vicarious", "Vicissitude", "Vignette", "Vilify"],

    // Set 48 (Lines 301-310)
    ["Vindictive", "Virulent", "Viscous", "Visionary", "Vituperate", "Vociferous", "Volition", "Voluble", "Wanton", "Wastrel"],

    // Set 49 (Lines 311-320)
    ["Wheedle", "Whelp", "Whet", "Wily", "Winsome", "Wistful", "Wizened", "Wynd", "Xenophobia", "Yoke"],

    // Set 50 (Line 321 - final word)
    ["Zealot"]
];

// Flat list for backward compatibility
export const REVIEW_BATCH_LIST = SET_BATCHES.flat();
