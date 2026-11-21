# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript

## Users

Świadomi konsumenci i osoby zainteresowane wpływem codziennych decyzji na klimat i etykę, które chcą odróżnić realny wpływ środowiskowy od marketingowego greenwashingu. Korzystają z aplikacji w przeglądarce (desktop i mobile), żeby szybko porównać konkretne dylematy z życia codziennego (np. „czy moje 50 zapytań do AI ma sens porównywać z jedną paczką lotniczą z Chin albo obiadem z wołowiną?”) i zobaczyć rzeczywiste rzędy wielkości.

## Product Purpose

Aplikacja w sposób obrazowy i natychmiast czytelny porównuje codzienne decyzje oraz działania na wspólnej skali fizycznej dla czterech kluczowych wymiarów środowiskowych — śladu węglowego (CO₂e), zużycia wody (litry), degradacji i zajętości gleby (m²) oraz zużycia energii (kWh) — demaskując mity greenwashingowe i pokazując prawdziwe rzędy wielkości. Ważnym filarem aplikacji jest także pokazanie, jak w czasie (dzień → miesiąc → rok → 5 lat) kumuluje się pozytywny wpływ wyboru diety wegańskiej na wszystkie cztery wymiary. Sukces oznacza moment „eureka” — użytkownik w ciągu kilku sekund rozumie proporcje między pozornie nieporównywalnymi wyborami i może zweryfikować każdą liczbę w źródłowym badaniu naukowym.

## Positioning

Jedna, uczciwa, przełączalna skala fizyczna dla czterech realnych metryk (CO₂e, woda, ziemia/degradacja gleby, energia) połączona z bezkompromisową wizualizacją rzędów wielkości, interaktywną kumulacją efektu diety wegańskiej oraz jawnym, klikalnym zapleczem naukowym (konkretne publikacje, raporty LCA, linki do źródeł przy każdej estymacji). Zamiast moralizowania lub pustych „eko-punktów”, aplikacja pozwala zestawić ze sobą dowolne codzienne decyzje i natychmiast zobaczyć, gdzie tkwi realny ciężar, a gdzie greenwashing.

## Operating Context

- Język interfejsu i treści: polski.
- Użytkownik przegląda gotowe, zaskakujące zestawienia („pojedynki” / mity greenwashingowe, np. zakupy z lokalnego magazynu krajowego vs paczka z Chin frachtem lotniczym/morskim, zapytania do AI vs streaming / gotowanie wody / przejazd autem / posiłek mięsny vs roślinny) oraz sam wybiera i zestawia dowolne działania na jednej wspólnej skali.
- Użytkownik przełącza wymiar fizyczny (CO₂e, Woda, Gleba/Ziemia, Energia) i obserwuje, jak zmieniają się proporcje tych samych decyzji.
- Dedykowany moduł kumulacji pokazuje narastający pozytywny wpływ diety wegańskiej w horyzoncie czasu (od 1 dnia do 5 lat) w oparciu o Scarborough et al. (Nature Food 2023) oraz Poore & Nemecek (Science 2018).
- Każda pozycja posiada czytelną wartość we wszystkich 4 wymiarach, założenia metodologiczne, krótki kontekst etyczny/greenwashingowy oraz bezpośrednie linki do źródeł naukowych i raportów LCA.

## Capabilities and Constraints

- Główna cecha i wyróżnik aplikacji: wyjątkowy, autorski design wizualizacji danych — proporcje i rzędy wielkości muszą być odczuwalne wizualnie, nie tylko zapisane w tabeli.
- Cztery fizyczne wymiary na wspólnej skali: ślad węglowy (CO₂e), zużycie wody (L), zajętość/degradacja gleby (m²), zużycie energii (kWh/Wh) + ekwiwalenty i demaskowanie greenwashingu.
- Kluczowy moduł kumulacji pozytywnego wpływu diety wegańskiej w czasie.
- Każda estymacja musi opierać się na realnych, zbadanych źródłach naukowych lub instytucjonalnych (np. Poore & Nemecek 2018 Science, Scarborough et al. 2023 Nature Food, Our World in Data, IEA, IPCC, DEFRA/DESNZ, Water Footprint Network, badania śladu energetycznego/wodnego LLM jak Luccioni et al. / Li et al. / Epoch AI, raporty LCA logistyki i e-commerce) z zaszytymi linkami i jasnym opisem założeń.
- Aplikacja statyczna / kliencka (React + Vite + TypeScript), bez wymaganego backendu.

## Evidence on Hand

- Dane naukowe i źródła LCA zostaną zebrane, zweryfikowane i zapisane jako strukturalny zbiór danych w aplikacji z rzeczywistymi URL-ami do publikacji/raportów (brak zmyślonych liczb ani fikcyjnych linków).
- Brak wcześniejszego kodu ani gotowych assetów graficznych (projekt greenfield).

## Product Principles

- **Rząd wielkości ponad wszystko:** Wizualizacja musi uczciwie oddawać skalę (w tym skoki o 10×, 100×, 1000×), nie spłaszczając dramatycznych różnic do jednakowych słupków.
- **Zero greenwashingu, zero moralizatorstwa:** Fakty, założenia metodologiczne i przejrzyste źródła mówią same za siebie.
- **Każda liczba ma dowód:** Żadna estymacja nie pojawia się bez podania założeń i bezpośredniego linku do badania lub raportu bazowego.
- **Natychmiastowy moment „eureka”:** Pierwszy ekran od razu stawia użytkownika w środku żywego, namacalnego porównania — bez marketingowych ogólników.
