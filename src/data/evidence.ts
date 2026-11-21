export type MetricKey = 'co2' | 'water' | 'land' | 'energy';

export interface MetricMeta {
  key: MetricKey;
  label: string;
  shortLabel: string;
  unit: string;
  fullName: string;
  dailyBudget15C?: number;
  description: string;
}

export interface ScientificSource {
  id: string;
  shortBadge: string;
  citation: string;
  institution: string;
  year: number;
  url: string;
  scope: string;
}

export type DecisionCategory =
  | 'logistyka'
  | 'cyfrowe'
  | 'dieta'
  | 'transport'
  | 'konsumpcja';

export interface DecisionItem {
  id: string;
  name: string;
  shortLabel: string;
  category: DecisionCategory;
  unit: string;
  metrics: Record<MetricKey, number>;
  primarySourceId: string;
  sourceIds: string[];
  assumptions: string;
  ethicalContext: string;
  greenwashingNote: string;
}

export interface DuelPreset {
  id: string;
  label: string;
  leftId: string;
  rightId: string;
  metric: MetricKey;
  verdictTitle: string;
  verdictBody: string;
  verifiedSourceId: string;
}

export interface DietBaseline {
  id: 'high-meat' | 'medium-meat' | 'low-meat';
  label: string;
  subtitle: string;
  dailySaved: Record<MetricKey, number>;
}

export const METRICS: Record<MetricKey, MetricMeta> = {
  co2: {
    key: 'co2',
    label: 'CO₂e',
    shortLabel: 'CO₂e (kg)',
    unit: 'kg CO₂e',
    fullName: 'Ślad węglowy (ekwiwalent CO₂)',
    dailyBudget15C: 6.3,
    description:
      'Całkowita emisja gazów cieplarnianych (CO₂, CH₄, N₂O) w cyklu życia (LCA). Dzienny budżet zgodny z celem 1,5°C wynosi ok. 6,3 kg CO₂e/os.',
  },
  water: {
    key: 'water',
    label: 'WODA (L)',
    shortLabel: 'Woda (L)',
    unit: 'L wody',
    fullName: 'Ślad wodny (zużycie słodkiej wody)',
    description:
      'Suma wody zużytej w produkcji, rolnictwie paszowym, chłodzeniu serwerowni i łańcuchu dostaw (metodologia Water Footprint Network & LCA).',
  },
  land: {
    key: 'land',
    label: 'GLEBA (m²)',
    shortLabel: 'Gleba (m²)',
    unit: 'm² gleby',
    fullName: 'Zajętość i presja degradacji gleby',
    description:
      'Powierzchnia gruntu (m²·rok) wymagana do wytworzenia produktu lub usługi — główny motor wylesiania, erozji i utraty bioróżnorodności.',
  },
  energy: {
    key: 'energy',
    label: 'ENERGIA (kWh)',
    shortLabel: 'Energia (kWh)',
    unit: 'kWh',
    fullName: 'Zużycie energii pierwotnej i elektrycznej',
    description:
      'Łączny nakład energetyczny (elektryczność, paliwa lotnicze/drogowe, energia procesowa) wyrażony w kilowatogodzinach.',
  },
};

export const METRIC_ORDER: MetricKey[] = ['co2', 'water', 'land', 'energy'];

export const CATEGORY_LABELS: Record<DecisionCategory, string> = {
  logistyka: 'Logistyka i zakupy',
  cyfrowe: 'AI i technologia',
  dieta: 'Żywność i dieta',
  transport: 'Transport',
  konsumpcja: 'Dobra i moda',
};

export const SOURCES: Record<string, ScientificSource> = {
  'poore-2018': {
    id: 'poore-2018',
    shortBadge: 'Poore & Nemecek 2018',
    citation:
      'Poore, J., & Nemecek, T. (2018). Reducing food’s environmental impacts through producers and consumers. Science, 360(6392), 987–992.',
    institution: 'University of Oxford / Science',
    year: 2018,
    url: 'https://doi.org/10.1126/science.aaq0216',
    scope: 'Metaanaliza 38 700 gospodarstw: CO₂e, zużycie wody i zajętość gleby dla żywności.',
  },
  'scarborough-2023': {
    id: 'scarborough-2023',
    shortBadge: 'Nature Food 2023',
    citation:
      'Scarborough, P. et al. (2023). Vegans, vegetarians, fish-eaters and meat-eaters in the UK show discrepant environmental impacts. Nature Food, 4, 565–574.',
    institution: 'University of Oxford / Nature Food',
    year: 2023,
    url: 'https://doi.org/10.1038/s43016-023-00795-w',
    scope: 'Porównanie rzeczywistych diet 55 504 osób pod kątem emisji, wody, gleby i bioróżnorodności.',
  },
  'defra-2024': {
    id: 'defra-2024',
    shortBadge: 'DEFRA 2024',
    citation:
      'UK DESNZ / DEFRA (2024). Greenhouse gas reporting: conversion factors 2024 (freight, aviation with RFI, passenger vehicles).',
    institution: 'UK Department for Energy Security & Net Zero',
    year: 2024,
    url: 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024',
    scope: 'Oficjalne wskaźniki emisji dla frachtu lotniczego, morskiego, kurierów, aut i lotnictwa.',
  },
  'glec-2023': {
    id: 'glec-2023',
    shortBadge: 'GLEC / Smart Freight',
    citation:
      'Smart Freight Centre (2023). Global Logistics Emissions Council (GLEC) Framework v3.0 (ISO 14083 aligned).',
    institution: 'Smart Freight Centre',
    year: 2023,
    url: 'https://www.smartfreightcentre.org/en/how-to-implement-items/what-is-glec-framework/',
    scope: 'Międzynarodowy standard liczenia emisji łańcuchów dostaw (air freight vs sea freight vs road).',
  },
  'epoch-ai-2025': {
    id: 'epoch-ai-2025',
    shortBadge: 'Epoch AI 2025',
    citation:
      'Epoch AI (2025). How much energy does ChatGPT use? Hardware-level inference energy analysis (~0.3 Wh per standard query).',
    institution: 'Epoch AI Research',
    year: 2025,
    url: 'https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use',
    scope: 'Pomiar zużycia energii pojedynczego zapytania do współczesnego modelu LLM.',
  },
  'li-2023-ai-water': {
    id: 'li-2023-ai-water',
    shortBadge: 'Li et al. 2023',
    citation:
      'Li, P., Yang, J., Islam, M. A., & Ren, S. (2023). Making AI Less "Thirsty": Uncovering and Addressing the Secret Water Footprint of AI Models. arXiv:2304.03271.',
    institution: 'UC Riverside / UT Arlington',
    year: 2023,
    url: 'https://arxiv.org/abs/2304.03271',
    scope: 'Szacunki bezpośredniego i pośredniego śladu wodnego chłodzenia serwerowni AI.',
  },
  'iea-streaming': {
    id: 'iea-streaming',
    shortBadge: 'IEA 2024',
    citation:
      'Kamiya, G. / International Energy Agency. The carbon footprint of streaming video: fact-checking the headlines.',
    institution: 'International Energy Agency (IEA)',
    year: 2024,
    url: 'https://www.iea.org/commentaries/the-carbon-footprint-of-streaming-video-fact-checking-the-headlines',
    scope: 'Weryfikacja zużycia energii i emisji CO₂e podczas streamingu wideo.',
  },
  'wfn-2011': {
    id: 'wfn-2011',
    shortBadge: 'Water Footprint Net.',
    citation:
      'Mekonnen, M. M., & Hoekstra, A. Y. (2011). The green, blue and grey water footprint of crops and derived crop products. HESS, 15, 1577–1600.',
    institution: 'Water Footprint Network / Univ. of Twente',
    year: 2011,
    url: 'https://doi.org/10.5194/hess-15-1577-2011',
    scope: 'Bazowy ślad wodny bawełny, pasz zwierzęcych, wołowiny i produktów rolnych.',
  },
  'kobize-2024': {
    id: 'kobize-2024',
    shortBadge: 'KOBiZE 2024',
    citation:
      'KOBiZE / IOŚ-PIB (2024). Wskaźniki emisyjności CO₂ dla energii elektrycznej w Polsce (~597 g CO₂/kWh).',
    institution: 'Krajowy Ośrodek Bilansowania i Zarządzania Emisjami',
    year: 2024,
    url: 'https://www.kobize.pl/pl/article/aktualnosci-2024/id/2530/wskazniki-emisyjnosci-dla-energii-elektrycznej-za-2023-r',
    scope: 'Oficjalny wskaźnik emisyjności polskiego miksu elektroenergetycznego.',
  },
  'eea-2024': {
    id: 'eea-2024',
    shortBadge: 'EEA 2024',
    citation:
      'European Environment Agency (2024). Transport and mobility — Greenhouse gas emissions from transport in Europe.',
    institution: 'European Environment Agency',
    year: 2024,
    url: 'https://www.eea.europa.eu/en/topics/in-depth/transport-and-mobility',
    scope: 'Porównanie emisji i energochłonności kolei, samochodów osobowych i lotnictwa w UE.',
  },
  'apple-fairphone-lca': {
    id: 'apple-fairphone-lca',
    shortBadge: 'LCA Smartfon 2024',
    citation:
      'Apple Environmental Progress Report (2024) & Fraunhofer IZM / Fairphone 5 LCA — Product Carbon Footprint of smartphones.',
    institution: 'Fraunhofer IZM / Product LCA',
    year: 2024,
    url: 'https://www.apple.com/environment/',
    scope: 'Pełny ślad produkcyjny smartfona (wydobycie metali ziem rzadkich, półprzewodniki, montaż).',
  },
  'owid-food': {
    id: 'owid-food',
    shortBadge: 'Our World in Data',
    citation:
      'Ritchie, H., & Roser, M. (2024). Environmental Impacts of Food Production. Our World in Data.',
    institution: 'Oxford Martin School / OWID',
    year: 2024,
    url: 'https://ourworldindata.org/environmental-impacts-of-food',
    scope: 'Otwarta synteza danych LCA dla produktów spożywczych i porównań transport vs produkcja.',
  },
};

export const DECISIONS: DecisionItem[] = [
  {
    id: 'ai-100-prompts',
    name: '100 zapytań do czatu AI (LLM)',
    shortLabel: '100 promptów AI',
    category: 'cyfrowe',
    unit: '100 zapytań tekstowych',
    metrics: {
      co2: 0.025,
      water: 1.8,
      land: 0.002,
      energy: 0.035,
    },
    primarySourceId: 'epoch-ai-2025',
    sourceIds: ['epoch-ai-2025', 'li-2023-ai-water'],
    assumptions:
      '~0,3–0,35 Wh energii na typowe zapytanie tekstowe (Epoch AI 2025) + pośrednia woda chłodząca serwerownię (~18 ml/zapytanie wg Li et al.). Nie obejmuje kosztu treningu rozłożonego na miliardy zapytań.',
    ethicalContext:
      'Choć centra danych lokalnie obciążają sieci elektroenergetyczne i zasoby wodne w suchych regionach, jednostkowy ślad 100 zapytań tekstowych jest o 2–3 rzędy wielkości niższy niż pojedynczy posiłek mięsny czy paczka lotnicza.',
    greenwashingNote:
      'Straszenie „szklanką wody za każde pytanie do AI” odwraca uwagę od decyzji o tysiąckrotnie wyższym śladzie wodnym (np. 1 stek wołowy = ~173 000 promptów AI pod względem wody).',
  },
  {
    id: 'kettle-boil',
    name: 'Zagotowanie 1 L wody w czajniku (PL)',
    shortLabel: 'Czajnik 1 L (PL)',
    category: 'cyfrowe',
    unit: '1 zagotowanie (1 L)',
    metrics: {
      co2: 0.066,
      water: 1.4,
      land: 0.005,
      energy: 0.11,
    },
    primarySourceId: 'kobize-2024',
    sourceIds: ['kobize-2024'],
    assumptions:
      'Podgrzanie 1 L wody z 15°C do 100°C w czajniku elektrycznym (~0,11 kWh) przy polskim wskaźniku emisyjności KOBiZE 0,597 kg CO₂/kWh.',
    ethicalContext:
      'Punkt odniesienia dla skali codziennej energii: pojedyncze zagotowanie pełnego czajnika zużywa ponad 3× więcej prądu niż 100 standardowych zapytań do AI.',
    greenwashingNote:
      'Świetny kalibrator rzędów wielkości: jeśli martwisz się o ślad 10 promptów AI, zagotowanie nadmiarowej szklanki wody w czajniku ma większy ślad węglowy.',
  },
  {
    id: 'parcel-pl',
    name: 'Paczka z magazynu w PL (kurier)',
    shortLabel: 'Magazyn w PL',
    category: 'logistyka',
    unit: '1 paczka (1 kg)',
    metrics: {
      co2: 0.38,
      water: 18,
      land: 0.08,
      energy: 1.45,
    },
    primarySourceId: 'defra-2024',
    sourceIds: ['defra-2024', 'glec-2023'],
    assumptions:
      'Przesyłka 1 kg z krajowego centrum logistycznego (ok. 300 km transportem drogowym skonsolidowanym + dostawa ostatniej mili do punktu odbioru/kuriera + karton z recyklingu).',
    ethicalContext:
      'Skonsolidowany transport lądowy i odbiór w punkcie/automacie paczkowym ogranicza puste przebiegi i presję na kurierów. Kluczowym kosztem pozostaje jednak sam produkt, nie tylko dostawa.',
    greenwashingNote:
      'Nawet „ekologiczna” przesyłka krajowa traci sens, jeśli zamawiasz 5 rzeczy i odsyłasz 4 — darmowe zwroty w e-commerce często kończą się utylizacją nowego towaru.',
  },
  {
    id: 'streaming-10h',
    name: '10 godzin streamingu wideo HD',
    shortLabel: 'Streaming 10 h',
    category: 'cyfrowe',
    unit: '10 godzin (TV/laptop)',
    metrics: {
      co2: 0.42,
      water: 4.5,
      land: 0.02,
      energy: 0.7,
    },
    primarySourceId: 'iea-streaming',
    sourceIds: ['iea-streaming', 'kobize-2024'],
    assumptions:
      'Analiza IEA dla sieci stacjonarnej + router + ekran laptopa/TV (~70 Wh/h łącznie przy polskim miksie energetycznym).',
    ethicalContext:
      'Większość energii w streamingu zużywa sam ekran odbiorcy (szczególnie duży telewizor 4K), a nie serwery czy transmisja danych.',
    greenwashingNote:
      'Popularny mit o „śladzie Netflixa równym jeździe samochodem” wynikał z błędu metodologicznego z 2019 r., skorygowanego przez IEA ponad 80-krotnie w dół.',
  },
  {
    id: 'meal-vegan',
    name: 'Obiad wegański (tofu, strączki, warzywa)',
    shortLabel: 'Obiad wegański',
    category: 'dieta',
    unit: '1 pełny posiłek (~700 kcal)',
    metrics: {
      co2: 0.52,
      water: 280,
      land: 1.1,
      energy: 1.2,
    },
    primarySourceId: 'poore-2018',
    sourceIds: ['poore-2018', 'owid-food'],
    assumptions:
      '150 g tofu/strączków + 100 g kaszy/ryżu + 200 g warzyw sezonowych + olej roślinny. Mediana światowa LCA wg Poore & Nemecek (2018).',
    ethicalContext:
      'Eliminuje hodowlę przemysłową i minimalizuje presję na wylesianie. Nawet importowane rośliny strączkowe mają wielokrotnie niższy ślad niż lokalna wołowina.',
    greenwashingNote:
      'Mit „jedz lokalnie zamiast roślinnie”: transport odpowiada zwykle za mniej niż 5–10% emisji żywności — kluczowe jest CO jesz, a nie skąd przyjechało (OWID / Science 2018).',
  },
  {
    id: 'parcel-china-sea',
    name: 'Paczka z Chin — fracht morski (1 kg)',
    shortLabel: 'Chiny (statek)',
    category: 'logistyka',
    unit: '1 paczka (1 kg, 20 000 km)',
    metrics: {
      co2: 0.62,
      water: 24,
      land: 0.1,
      energy: 2.35,
    },
    primarySourceId: 'glec-2023',
    sourceIds: ['glec-2023', 'defra-2024'],
    assumptions:
      'Transport kontenerowcem (ok. 20 000 km × 0,016 kg CO₂e/t·km) + dowóz portowy i krajowy kurier (GLEC v3.0). Dotyczy samej logistyki bez produkcji towaru.',
    ethicalContext:
      'Sam fracht morski jest zaskakująco niskoemisyjny na kilogram, ale ultra-tanie platformy z Azji wiążą się z ryzykiem niskich standardów pracy, nadprodukcji jednorazówek i braku serwisu.',
    greenwashingNote:
      'Różnica między statkiem a samolotem z Chin to 20× w CO₂e. Niestety zakupy „darmowa dostawa w 7 dni” z platform ultra-fast-commerce lecą niemal wyłącznie samolotem.',
  },
  {
    id: 'meal-chicken',
    name: 'Obiad z kurczakiem (200 g mięsa)',
    shortLabel: 'Obiad z kurczakiem',
    category: 'dieta',
    unit: '1 posiłek (200 g drobiu)',
    metrics: {
      co2: 2.15,
      water: 890,
      land: 3.4,
      energy: 4.8,
    },
    primarySourceId: 'poore-2018',
    sourceIds: ['poore-2018', 'owid-food'],
    assumptions:
      '200 g mięsa drobiowego (~9,9 kg CO₂e/kg wg Poore & Nemecek) + dodatki roślinne i obróbka termiczna.',
    ethicalContext:
      'Choć drób ma znacznie niższy ślad węglowy niż wołowina, odpowiada za największą skalę chowu klatkowego i intensywnej hodowli przemysłowej pod względem liczby zwierząt.',
    greenwashingNote:
      'Zamiana wołowiny na kurczaka obniża CO₂e o ~80%, ale dopiero przejście na białko roślinne tnie jednocześnie emisje, zużycie wody i problem chowu przemysłowego.',
  },
  {
    id: 'train-100km',
    name: 'Pociąg elektryczny w PL (100 km)',
    shortLabel: 'Pociąg 100 km',
    category: 'transport',
    unit: '100 km / pasażer',
    metrics: {
      co2: 2.8,
      water: 18,
      land: 0.15,
      energy: 4.7,
    },
    primarySourceId: 'eea-2024',
    sourceIds: ['eea-2024', 'kobize-2024'],
    assumptions:
      'Średnie obłożenie pociągu pasażerskiego (~47 Wh/pasażerokilometr) zasilanego polskim miksem elektroenergetycznym (KOBiZE 2024).',
    ethicalContext:
      'Nawet przy polskim miksie z dużym udziałem węgla kolej elektryczna generuje ponad 6× mniej CO₂e na pasażera niż jazda samochodem spalinowym w pojedynkę.',
    greenwashingNote:
      'Argument „pociągi w Polsce i tak jeżdżą na węgiel” to klasyczna manipulacja — fizyczna sprawność kolei bije silnik spalinowy o cały rząd wielkości.',
  },
  {
    id: 'dairy-cheese',
    name: '250 g żółtego sera (nabiał)',
    shortLabel: 'Ser żółty 250 g',
    category: 'dieta',
    unit: '1 kostka (250 g)',
    metrics: {
      co2: 5.95,
      water: 1400,
      land: 18.5,
      energy: 7.2,
    },
    primarySourceId: 'poore-2018',
    sourceIds: ['poore-2018', 'wfn-2011'],
    assumptions:
      'Wyprodukowanie 1 kg sera wymaga ok. 10 L mleka krowiego (~23,8 kg CO₂e/kg oraz ~5 600 L wody i ~74 m²·rok ziemi wg Poore & Nemecek).',
    ethicalContext:
      'Nabiał twardy ma wyższy ślad węglowy i glebowy na kilogram niż mięso drobiowe czy wieprzowina, co często zaskakuje osoby ograniczające wyłącznie mięso.',
    greenwashingNote:
      'Etykiety „szczęśliwe krowy na łące” nie zmieniają fizjologii przeżuwaczy — emisje metanu i zapotrzebowanie na pastwiska pozostają bardzo wysokie.',
  },
  {
    id: 'tshirt-cotton',
    name: 'Nowy bawełniany T-shirt (fast fashion)',
    shortLabel: 'T-shirt bawełniany',
    category: 'konsumpcja',
    unit: '1 sztuka (250 g)',
    metrics: {
      co2: 6.5,
      water: 2700,
      land: 9.2,
      energy: 19.4,
    },
    primarySourceId: 'wfn-2011',
    sourceIds: ['wfn-2011', 'eea-2024'],
    assumptions:
      'Uprawa bawełny (ok. 2 700 L wody wg Water Footprint Network), przędzenie, barwienie, szycie i transport do Europy.',
    ethicalContext:
      'Przemysł fast fashion łączy ogromne zużycie wody w regionach deficytu (Azja Środkowa, Indie), zanieczyszczenie rzek barwnikami oraz wyzysk płacowy w szwalniach.',
    greenwashingNote:
      'Kolekcje „Conscious / Eco” z 20% bawełny z recyklingu to podręcznikowy greenwashing, gdy marka jednocześnie zwiększa wolumen nowych ubrań co sezon.',
  },
  {
    id: 'parcel-china-air',
    name: 'Paczka z Chin (fracht lotniczy)',
    shortLabel: 'Paczka z Chin (lot)',
    category: 'logistyka',
    unit: '1 paczka (1 kg, ~8 000 km)',
    metrics: {
      co2: 12.4,
      water: 145,
      land: 0.35,
      energy: 46.8,
    },
    primarySourceId: 'glec-2023',
    sourceIds: ['glec-2023', 'defra-2024'],
    assumptions:
      'Ekspresowy fracht lotniczy Chiny–Polska (~8 000 km, wskaźnik DEFRA/GLEC z uwzględnieniem efektu wysokościowego RFI + obsługa lotniskowa i kurier lokalny).',
    ethicalContext:
      'Model ultra-tanich przesyłek lotniczych z pominięciem kontenerów morskich dramatycznie podbija emisje lotnictwa cargo i utrwala kulturę jednorazowych gadżetów bez kontroli jakości i praw pracowniczych.',
    greenwashingNote:
      'Fracht lotniczy generuje ponad 32× wyższy ślad węglowy niż logistyka lądowa z magazynu w PL. Deklaracje „neutralnej dostawy” oparte na tanich offsetach to greenwashing.',
  },
  {
    id: 'meal-beef',
    name: 'Obiad z wołowiną (200 g steku)',
    shortLabel: 'Stek wołowy 200 g',
    category: 'dieta',
    unit: '1 posiłek (200 g wołowiny)',
    metrics: {
      co2: 12.8,
      water: 3120,
      land: 32.6,
      energy: 14.5,
    },
    primarySourceId: 'poore-2018',
    sourceIds: ['poore-2018', 'wfn-2011', 'owid-food'],
    assumptions:
      '200 g wołowiny (średnia globalna ~60–64 kg CO₂e/kg, ~15 400 L wody/kg, ~163 m²·rok ziemi/kg wg Poore & Nemecek 2018 i WFN) + dodatki.',
    ethicalContext:
      'Hodowla bydła odpowiada za największą pojedynczą część wylesiania na świecie (w tym Amazonii), degradację gleby przez nadmierny wypas i gigantyczne zużycie wody na paszę.',
    greenwashingNote:
      'Jeden 200-gramowy stek wołowy obciąża glebę niemal 30× mocniej niż pełny obiad wegański i zużywa tyle wody, co ponad 170 000 zapytań do AI.',
  },
  {
    id: 'car-100km',
    name: 'Przejazd autem spalinowym (100 km)',
    shortLabel: 'Auto 100 km',
    category: 'transport',
    unit: '100 km (1 osoba, benzyna)',
    metrics: {
      co2: 17.1,
      water: 120,
      land: 0.9,
      energy: 64.0,
    },
    primarySourceId: 'defra-2024',
    sourceIds: ['defra-2024', 'eea-2024'],
    assumptions:
      'Średni europejski samochód benzynowy (~171 g CO₂e/km Well-to-Wheel, ~6,8 L/100 km) z jednym kierowcą na pokładzie.',
    ethicalContext:
      'Oprócz emisji CO₂e, transport samochodowy generuje pyły PM2.5/PM10 ze ścierania opon i hamulców, hałas oraz ogromną zajętość przestrzeni publicznej w miastach.',
    greenwashingNote:
      'Reklamy „czystych” ciężkich SUV-ów spalinowych (hybrydy mild-hybrid) ukrywają fakt, że wzrost masy aut zniwelował lata poprawy sprawności silników.',
  },
  {
    id: 'smartphone-new',
    name: 'Zakup nowego smartfona (produkcja)',
    shortLabel: 'Nowy smartfon',
    category: 'konsumpcja',
    unit: '1 urządzenie (LCA)',
    metrics: {
      co2: 68.0,
      water: 12760,
      land: 14.0,
      energy: 185.0,
    },
    primarySourceId: 'apple-fairphone-lca',
    sourceIds: ['apple-fairphone-lca', 'wfn-2011'],
    assumptions:
      '80–85% śladu węglowego smartfona powstaje przed pierwszym włączeniem (wydobycie kobaltu/litu, produkcja chipów, ekranu i baterii).',
    ethicalContext:
      'Łańcuchy dostaw elektroniki niosą wysokie ryzyko naruszeń praw człowieka przy wydobyciu minerałów (np. kobalt w DRK) oraz generują najszybciej rosnący strumień elektrośmieci.',
    greenwashingNote:
      'Usunięcie ładowarki z pudełka to ułamek śladu — realną różnicą jest używanie telefonu 5 lat zamiast wymiany co 2 lata.',
  },
  {
    id: 'flight-eu',
    name: 'Lot Warszawa–Londyn (w obie strony)',
    shortLabel: 'Lot WAW–LON',
    category: 'transport',
    unit: '1 pasażer, klasa ekonomiczna',
    metrics: {
      co2: 395.0,
      water: 480,
      land: 1.6,
      energy: 1320.0,
    },
    primarySourceId: 'defra-2024',
    sourceIds: ['defra-2024', 'eea-2024'],
    assumptions:
      'Ok. 2 900 km w obie strony, przelicznik DEFRA 2024 dla lotów krótkodystansowych z uwzględnieniem efektu nie-CO₂ na dużej wysokości (RFI ×1,7).',
    ethicalContext:
      'Ok. 1% najbogatszej populacji świata odpowiada za połowę emisji lotnictwa pasażerskiego — pojedynczy weekendowy lot zużywa ponad 62 dni budżetu klimatycznego 1,5°C.',
    greenwashingNote:
      'Opcja „dopłać 12 zł za neutralny lot (SAF / sadzenie drzew)” przy zakupie biletu to jeden z najbardziej krytykowanych przykładów greenwashingu w Europie.',
  },
  {
    id: 'vegan-year',
    name: '1 rok diety wegańskiej (oszczędność)',
    shortLabel: '1 rok weganizmu',
    category: 'dieta',
    unit: 'oszczędność vs średnia dieta mięsna',
    metrics: {
      co2: 1497.0,
      water: 419750,
      land: 1778.0,
      energy: 1241.0,
    },
    primarySourceId: 'scarborough-2023',
    sourceIds: ['scarborough-2023', 'poore-2018', 'wfn-2011'],
    assumptions:
      'Różnica między dietą wegańską a średnią dietą mięsną (50–99 g mięsa/dzień) przez 365 dni wg Scarborough et al. (Nature Food 2023) i WFN. Wartość reprezentuje UNIKNIĘTY wpływ.',
    ethicalContext:
      'Największa codzienna dźwignia indywidualna dostępna bez kosztownych inwestycji: w ciągu roku oszczędza równowartość niemal 4 lotów po Europie i 1 778 m² gleby przed degradacją.',
    greenwashingNote:
      'Zamiast skupiać się na symbolicznych gestach jak papierowe słomki, kumulacja codziennych wyborów żywieniowych działa w skali tysięcy kilogramów CO₂e i setek tysięcy litrów wody.',
  },
];

export const DUEL_PRESETS: DuelPreset[] = [
  {
    id: 'pl-vs-china',
    label: 'Magazyn w PL vs Chiny (lot)',
    leftId: 'parcel-pl',
    rightId: 'parcel-china-air',
    metric: 'co2',
    verdictTitle: 'Fracht lotniczy vs logistyka krajowa',
    verdictBody:
      'Fracht lotniczy generuje ponad 32× wyższy ślad węglowy niż logistyka lądowa z magazynu w Polsce. Deklaracje „ekspresowej zielonej dostawy” bez danych LCA to greenwashing.',
    verifiedSourceId: 'glec-2023',
  },
  {
    id: 'ai-vs-china',
    label: '100 promptów AI vs Paczka z Chin',
    leftId: 'ai-100-prompts',
    rightId: 'parcel-china-air',
    metric: 'co2',
    verdictTitle: 'Skala 1 : 496 — panika wokół AI vs zakupy lotnicze',
    verdictBody:
      'Jedna 1-kilogramowa paczka wysłana samolotem z Chin odpowiada pod względem CO₂e niemal 50 000 standardowych zapytań do AI. Dyskusja o klimacie często myli rzędy wielkości.',
    verifiedSourceId: 'epoch-ai-2025',
  },
  {
    id: 'ai-vs-beef-water',
    label: '100 promptów AI vs Stek (Woda)',
    leftId: 'ai-100-prompts',
    rightId: 'meal-beef',
    metric: 'water',
    verdictTitle: 'Mit wodny AI vs produkcja wołowiny',
    verdictBody:
      'Jeden obiad z 200 g wołowiny zużywa ponad 3 120 L wody — to ponad 1 730× więcej niż 100 zapytań do AI (ok. 1,8 L). Jeśli chcesz oszczędzać wodę, talerz bije czat o trzy rzędy wielkości.',
    verifiedSourceId: 'poore-2018',
  },
  {
    id: 'vegan-vs-beef-land',
    label: 'Obiad wegański vs Wołowina (Gleba)',
    leftId: 'meal-vegan',
    rightId: 'meal-beef',
    metric: 'land',
    verdictTitle: 'Presja na glebę i wylesianie: różnica 29,6×',
    verdictBody:
      'Wyprodukowanie jednego steku wołowego angażuje 32,6 m²·rok ziemi wobec 1,1 m²·rok dla pełnowartościowego obiadu wegańskiego. Hodowla bydła to główny motor degradacji gleb.',
    verifiedSourceId: 'poore-2018',
  },
  {
    id: 'china-sea-vs-air',
    label: 'Chiny: Statek vs Samolot',
    leftId: 'parcel-china-sea',
    rightId: 'parcel-china-air',
    metric: 'co2',
    verdictTitle: 'Ten sam dystans, 20× wyższe emisje',
    verdictBody:
      'Paczka płynąca kontenerowcem z Chin emituje zaledwie 0,62 kg CO₂e wobec 12,40 kg w transporcie lotniczym. Pośpiech i „darmowy ekspres w 7 dni” mają ogromny ukryty koszt.',
    verifiedSourceId: 'defra-2024',
  },
  {
    id: 'train-vs-car',
    label: 'Pociąg vs Auto (100 km)',
    leftId: 'train-100km',
    rightId: 'car-100km',
    metric: 'energy',
    verdictTitle: 'Kolej elektryczna wygrywa nawet na węglu',
    verdictBody:
      'Na dystansie 100 km pociąg zużywa 13,6× mniej energii i emituje 6,1× mniej CO₂e niż samotna jazda autem spalinowym — nawet po uwzględnieniu polskiego miksu energetycznego KOBiZE.',
    verifiedSourceId: 'kobize-2024',
  },
];

export const VEGAN_BASELINES: DietBaseline[] = [
  {
    id: 'medium-meat',
    label: 'Średnia dieta mięsna',
    subtitle: '50–99 g mięsa dziennie (typowy profil UE)',
    dailySaved: {
      co2: 4.1,
      water: 1150,
      land: 4.87,
      energy: 3.4,
    },
  },
  {
    id: 'high-meat',
    label: 'Dieta wysokomięsna',
    subtitle: 'powyżej 100 g mięsa dziennie',
    dailySaved: {
      co2: 7.77,
      water: 1780,
      land: 12.41,
      energy: 6.3,
    },
  },
  {
    id: 'low-meat',
    label: 'Dieta niskomięsna',
    subtitle: 'poniżej 50 g mięsa dziennie',
    dailySaved: {
      co2: 2.9,
      water: 760,
      land: 2.75,
      energy: 2.2,
    },
  },
];

export function getDecisionById(id: string): DecisionItem {
  return DECISIONS.find((d) => d.id === id) ?? DECISIONS[0];
}

export function formatNumberPL(value: number, maxDecimals = 2): string {
  const safeMax = Math.max(0, Math.min(20, Math.floor(maxDecimals)));
  if (value >= 1000) {
    return Math.round(value).toLocaleString('pl-PL');
  }
  if (value >= 100) {
    return value.toLocaleString('pl-PL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.min(1, safeMax),
    });
  }
  if (value >= 10) {
    return value.toLocaleString('pl-PL', {
      minimumFractionDigits: Math.min(1, safeMax),
      maximumFractionDigits: safeMax,
    });
  }
  if (value >= 0.1) {
    return value.toLocaleString('pl-PL', {
      minimumFractionDigits: Math.min(2, safeMax),
      maximumFractionDigits: safeMax,
    });
  }
  return value.toLocaleString('pl-PL', {
    minimumFractionDigits: Math.min(3, Math.max(safeMax, 2)),
    maximumFractionDigits: Math.max(3, safeMax),
  });
}

export function formatMetricValue(value: number, metric: MetricKey): string {
  const unit = METRICS[metric].unit;
  return `${formatNumberPL(value)} ${unit}`;
}

export function formatRatio(leftVal: number, rightVal: number): {
  label: string;
  heavier: 'left' | 'right' | 'equal';
  factor: number;
} {
  if (Math.abs(leftVal - rightVal) < 1e-6) {
    return { label: '1 : 1,0', heavier: 'equal', factor: 1 };
  }
  if (rightVal > leftVal) {
    const factor = rightVal / Math.max(leftVal, 1e-6);
    const formatted =
      factor >= 100
        ? Math.round(factor).toLocaleString('pl-PL')
        : factor.toLocaleString('pl-PL', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          });
    return { label: `1 : ${formatted}`, heavier: 'right', factor };
  }
  const factor = leftVal / Math.max(rightVal, 1e-6);
  const formatted =
    factor >= 100
      ? Math.round(factor).toLocaleString('pl-PL')
      : factor.toLocaleString('pl-PL', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });
  return { label: `${formatted} : 1`, heavier: 'left', factor };
}
