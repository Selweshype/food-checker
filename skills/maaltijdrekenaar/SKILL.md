---
name: maaltijdrekenaar
description: Rekent voor Wessel uit hoeveel koolhydraten er in een avondmaaltijd met meerdere koolhydraatbronnen zitten (quiche, ovenschotel, wraps met rijst, noedelgerecht) en hoeveel hij mag koken of opscheppen zonder over zijn grens te gaan. Gebruik deze skill altijd als Wessel ingrediënten van een maaltijd noemt, inspreekt, een recept-link deelt of een foto van een kookboekpagina stuurt en wil weten hoeveel aardappel, pasta, rijst, bladerdeeg, wraps, couscous, soba, udon of ramen hij kan gebruiken, of hoeveel gram/stukken hij van het gerecht mag nemen. Ook bij "hoeveel mag ik ervan", "past dit in mijn koolhydraten", "reken mijn portie uit", "voor twee personen koken" of "maaltijdrekenaar", ook als hij het woord koolhydraten niet gebruikt.
---

# Maaltijdrekenaar

Wessel volgt een voedingsschema van zijn diëtist. Bij het avondeten mag hij **75–100 g ongekookt graanproduct** eten, dat is **200–250 g gekookt**. Hij kookt meestal voor twee: hij eet **60%** van het gerecht, zijn vriendin 40%, tenzij hij iets anders zegt. Hij wil geen hoofdrekenen met meerdere koolhydraatbronnen. Jij doet dat voor hem en geeft een kort, duidelijk antwoord in het Nederlands.

Wessel is dyslectisch: korte zinnen, grote getallen vooraan, geen lange uitleg.

## Hoe het rekenen werkt

Alles wordt omgerekend naar **portiegram**: 1 portiegram = 1 g ongekookt graanproduct. Droge pasta, rijst, couscous en noedels tellen 1 op 1, zoals in de PDF. Gekookt graan telt voor 0,4. Andere producten (bladerdeeg, aardappel, wraps, voorgekookte udon) tellen naar hun koolhydraten ten opzichte van droge pasta (70 g kh per 100 g). Zo blijft de grens van de diëtist de maatstaf en kun je toch verschillende bronnen optellen.

Reken nooit uit je hoofd. Gebruik altijd het script, zodat de uitkomst elke keer hetzelfde is:

```
python3 scripts/bereken.py --item <product>:<gram> [--item ...] [--zoek <product>] [--aandeel 0.6] [--gewicht <gram>] [--stukken <n>]
```

Producten in het script: `pasta_droog`, `pasta_gekookt`, `volkoren_rijst_droog`, `volkoren_rijst_gekookt`, `japanse_rijst_droog`, `japanse_rijst_gekookt`, `couscous_droog`, `couscous_gekookt`, `soba_droog`, `ramen_droog`, `udon_droog`, `udon_voorgekookt`, `noedels_gekookt`, `bladerdeeg`, `aardappel_rauw`, `aardappel_gekookt`, `zoete_aardappel_rauw`, `zoete_aardappel_gekookt`, `volkoren_wrap`.

Een ander product, of een etiket met een andere waarde: `--item naam:gram:kh_per_100g`. Noemt Wessel een etiketwaarde, gebruik die dan in plaats van de standaard.

## Werkwijze

1. **Ingrediënten verzamelen.** Uit gesproken tekst, een recept-link of een foto van een kookboek. Haal alleen de koolhydraatbronnen eruit met hun gewicht. Ei, kaas, room, groente, vlees en vis tellen niet mee. Rekent het recept voor meer personen dan Wessel kookt, schaal dan eerst naar zijn aantal. Zet stuks om naar gram: 1 vel bladerdeeg ≈ 47 g (of wat Wessel zegt), kleine volkoren wrap ≈ 40 g, grote ≈ 70 g, middelgrote aardappel ≈ 150 g.
2. **Ontbreekt er iets wezenlijks** (gewicht van een koolhydraatbron, of bij Vraag 1 welk product hij wil bijvullen), stel dan één korte vraag. Ontbreekt alleen iets kleins, neem een redelijke aanname en noem die.
3. **Bepaal de vraag.**
   - *Vraag 1, vooraf:* "hoeveel X kan ik toevoegen" → gebruik `--zoek X` met de vaste bronnen als `--item`.
   - *Vraag 2, achteraf:* "hoeveel mag ik ervan nemen" → alle bronnen als `--item`, plus `--gewicht` (heel gerecht na bereiden) of `--stukken` als Wessel die weet. Weet hij het gewicht niet, vraag hem het gerecht te wegen of zeg in hoeveel stukken hij snijdt.
   - Vaak wil hij beide. Doe dan beide.
4. **Draai het script** en neem de getallen over. Rond af zoals het script doet.
5. **Antwoord in dit format:**

```
🍽️ [gerecht] · jij 60%

[Vraag 1] Voeg hoogstens [X] g [product] toe.
[Vraag 2] Neem hoogstens [Y] g of [Z] stukken.

Jouw deel: [n] portiegram · grens 75–100 ✓/✗
Rekensom: [bron 1] [g] = [pg] · [bron 2] [g] = [pg] · totaal [pg]
Aanname: [alleen als je iets hebt aangenomen, bijv. kh-waarde van bladerdeeg; zeg: check het etiket]
```

Laat Vraag 1 of Vraag 2 weg als die niet gesteld is. Zit hij boven de grens, zeg dan concreet hoe het past, bijvoorbeeld "gebruik 3 vellen bladerdeeg in plaats van 4" of "neem 5 in plaats van 6 stukken". Zit hij onder de 75, zeg hoeveel er nog bij kan.

## Losse koolhydraten

Eet Wessel pasta of aardappel los naast de rest, dan weegt hij zijn eigen portie zelf af. Je hoeft dan niet te rekenen met 60%. Geef gewoon zijn grens in gram van dat product (bijvoorbeeld aardappel: 75–100 portiegram ≈ 350–465 g gekookte aardappel; draai het script met `--aandeel 1` en `--zoek`).

## Waarden zijn schattingen

De koolhydraatwaarden in het script zijn gemiddelden van Nederlandse etiketten. Noem in "Aanname" welke schatting het zwaarst meetelt, zodat Wessel het etiket kan checken. Dit is geen medisch advies; bij twijfel geldt wat de diëtist zegt.
