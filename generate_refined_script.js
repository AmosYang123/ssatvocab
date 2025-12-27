import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vocabFile = fs.readFileSync(path.join(__dirname, 'data', 'vocab.ts'), 'utf8');

const wordStatuses = {
    "Bard": "review", "Berate": "review", "Brash": "review", "Concoct": "review", "Daft": "review",
    "Dearth": "review", "Deft": "review", "Desolate": "review", "Dynamic": "review", "Excursion": "review",
    "Fabricate": "review", "Flattery": "review", "Forage": "review", "Gregarious": "review", "Incessant": "review",
    "Innate": "review", "Innocuous": "review", "Inundate": "review", "Abate": "review", "Abhor": "review",
    "Abhorrent": "review", "Aggregate": "review", "Allay": "review", "Aloof": "review", "Amoral": "review",
    "Amorous": "review", "Apartheid": "review", "Apathy": "review", "Ascertain": "review", "Atone": "review",
    "Augment": "review", "Brazen": "review", "Buffet (verb)": "review", "Burgeon": "review", "Cajole": "review",
    "Camaraderie": "review", "Cavort": "review", "Chastise": "review", "Commendable": "review", "Compel": "review",
    "Concede": "review", "Confound": "review", "Cosmopolitan": "review", "Cursory": "review", "Defunct": "review",
    "Delude": "review", "Dilapidated": "review", "Diminutive": "review", "Disparity": "review", "Dissipate": "review",
    "Dissociate": "review", "Divisive": "review", "Domicile": "review", "Entomology": "review", "Erroneous": "review",
    "Feign": "review", "Fickle": "review", "Forlorn": "review", "Forsake": "review", "Fortitude": "review",
    "Gluttonous": "review", "Grandiose": "review", "Grotto": "review", "Hapless": "review", "Harrowing": "review",
    "Henchman": "review", "Impudent": "review", "Inclement": "review", "Indignation": "review", "Infuse": "review",
    "Bide": "review", "Douse": "review", "Gape": "review", "Hail": "review", "Abrogate": "review", "Abscond": "review",
    "Accede": "review", "Acumen": "review", "Aggrandize": "review", "Akimbo": "review", "Alacrity": "review",
    "Algid": "review", "Amalgamation": "review", "Ameliorate": "review", "Amorphous": "review", "Anachronism": "review",
    "Antechamber": "review", "Aphorism": "review", "Apparitional": "review", "Ascetic": "review", "Assuage": "review",
    "Austere": "review", "Baleful": "review", "Bereft": "review", "Bilk": "review", "Blandish": "review",
    "Bourgeois": "review", "Brumal": "review", "Brusque": "review", "Cacophony": "review", "Cadence": "review",
    "Calumny": "review", "Capricious": "review", "Carouse": "review", "Circumlocution": "review", "Circumspect": "review",
    "Clairvoyant": "review", "Coalesce": "review", "Cogent": "review", "Collusion": "review", "Comatose": "review",
    "Commodious": "review", "Complicit": "review", "Conciliatory": "review", "Concord": "review", "Confluence": "review",
    "Contusion": "review", "Convalescence": "review", "Corpulent": "review", "Credulity": "review", "Derelict": "review",
    "Diaphanous": "review", "Disparage": "review", "Disparate": "review", "Dissonance": "review", "Doppelganger": "review",
    "Elegy": "review", "Elocution": "review", "Elucidate": "review", "Enervate": "review", "Enervated": "review",
    "Espouse": "review", "Espy": "review", "Ethereal": "review", "Exacerbate": "review", "Exigent": "review",
    "Existential": "review", "Exorbitant": "review", "Extol": "review", "Fabulist": "review", "Facile": "review",
    "Fallacious": "review", "Fatuous": "review", "Fecund": "review", "Fetter": "review", "Fey": "review",
    "Firmament": "review", "Flaccid": "review", "Flout": "review", "Forestall": "review", "Fortious": "review",
    "Frenetic": "review", "Glib": "review", "Goad": "review", "Gourmand": "review", "Guile": "review", "Hedonist": "review",
    "Hiatus": "review", "Hiemal": "review", "Histrionic": "review", "Idolatrous": "review", "Illusory": "review",
    "Immutable": "review", "Impecunious": "review", "Impervious": "review", "Incisive": "review", "Indictment": "review",
    "Inextricable": "review", "Inimical": "review", "Iniquity": "review", "Inquisitor": "review", "Invective": "review",
    "Inveterate": "review", "Irascible": "review"
};

const regex = /\{ name: '(.+?)', definition: '(.+?)',/g;
const vocab = [];
let match;
while ((match = regex.exec(vocabFile)) !== null) {
    vocab.push({ name: match[1], definition: match[2] });
}

const reviewWords = Object.keys(wordStatuses);

const generateRefinedSentence = (wordName) => {
    let searchName = wordName;
    if (wordName === 'Fortious') searchName = 'Fortuitous';

    const word = vocab.find(v => v.name === searchName);
    if (!word) return null;

    const synIndex = word.definition.indexOf('Synonyms:');
    const exIndex = word.definition.indexOf('(Ex:');

    let defPart = word.definition.substring(0, synIndex !== -1 ? synIndex : (exIndex !== -1 ? exIndex : word.definition.length)).trim().replace(/\.$/, '');
    const synsPart = synIndex !== -1 ? word.definition.substring(synIndex + 9, exIndex !== -1 ? exIndex : word.definition.length).trim().replace(/\.$/, '') : '';
    const examplePart = exIndex !== -1 ? word.definition.substring(exIndex + 4, word.definition.length).trim().replace(/\)$/, '') : '';

    const displayWord = wordName.replace(' (verb)', '').replace(' (noun)', '');

    // Transform definitions to be a bit more natural for the repetitions
    let naturalDef = defPart;
    if (naturalDef.toLowerCase().startsWith('to ')) {
        naturalDef = naturalDef.substring(0, 3) + naturalDef.substring(3); // keep the 'to' but we'll use it in context
    }

    // 1. Definition Intro
    let intro = "";
    if (defPart.toLowerCase().startsWith('to ')) {
        intro = `${displayWord} refers to ${defPart.toLowerCase()}. `;
    } else if (/^(a|an)\s/i.test(defPart)) {
        intro = `${displayWord} refers to ${defPart.toLowerCase()}. `;
    } else {
        intro = `${displayWord} refers to ${defPart.toLowerCase()}. `;
    }

    // Special cases requested by user example flow
    if (displayWord === 'Bard') {
        intro = "Bard refers to a poet or storyteller. ";
    }

    // 2. Synonyms / Explanation
    let explanation = "";
    const synList = synsPart.split(',').map(s => s.trim()).filter(s => s && !s.includes('批判'));
    const synString = synList.length > 1
        ? synList.slice(0, -1).join(', ') + ' or ' + synList[synList.length - 1]
        : synList[0];

    if (synString) {
        explanation = `You'd use it to describe things like a ${synString.toLowerCase()}. `;
    }

    // 3. Example
    let example = examplePart ? `For example, you could say: "${examplePart}" ` : "";

    // 4. Repeated Definition at the end
    const repetition = `${displayWord} refers to ${defPart.toLowerCase()}. `;

    return (intro + explanation + example + repetition).trim() + "[pause] [pause]";
};

const finalRefinedScript = reviewWords.map(generateRefinedSentence).filter(Boolean).join('\n');

fs.writeFileSync(path.join(__dirname, 'review_script_natural.txt'), finalRefinedScript);
console.log('File created: review_script_natural.txt');
