---
name: maaltijdrekenaar
description: Rekent voor Wessel uit hoeveel koolhydraten er in een avondmaaltijd met meerdere koolhydraatbronnen zitten (quiche, ovenschotel, wraps met rijst, noedelgerecht) en hoeveel hij mag koken of opscheppen zonder over zijn grens te gaan. Gebruik deze skill altijd als Wessel ingrediënten van een maaltijd noemt, inspreekt, een recept-link deelt of een foto van een kookboekpagina stuurt en wil weten hoeveel aardappel, pasta, rijst, bladerdeeg, wraps, couscous, soba, udon of ramen hij kan gebruiken, of hoeveel gram/stukken hij van het gerecht mag nemen. Ook bij "hoeveel mag ik ervan", "past dit in mijn koolhydraten", "reken mijn portie uit", "voor twee personen koken" of "maaltijdrekenaar", ook als hij het woord koolhydraten niet gebruikt.
---

# Maaltijdrekenaar

Wessel volgt een voedingsschema van zijn diëtist. Bij het avondeten mag hij **75–100 g ongekookt graanproduct** eten, dat is **200–250 g gekookt**. Hij kookt meestal voor twee: hij eet **60%** van het gerecht, zijn vriendin 40%, tenzij hij iets anders zegt. Hij wil geen hoofdrekenen met meerdere koolhydraatbronnen. Jij doet dat voor hem en geeft een kort, duidelijk antwoord in het Nederlands.

Wessel is dyslectisch en heeft dyscalculie. Hij kan niet rekenen met procenten of breuken. Geef hem daarom altijd iets om te **tellen** in plaats van te rekenen: een plaatje van de bakvorm met zijn stukken groen en genummerd. Korte zinnen, één hoofdgetal per regel, geen procenten in het hoofdantwoord.

## Hoe het rekenen werkt

Alles wordt omgerekend naar **portiegram**: 1 portiegram = 1 g ongekookt graanproduct. Droge pasta, rijst, couscous en noedels tellen 1 op 1, zoals in de PDF. Gekookt graan telt voor 0,4. Andere producten (bladerdeeg, aardappel, wraps, voorgekookte udon) tellen naar hun koolhydraten ten opzichte van droge pasta (70 g kh per 100 g). Zo blijft de grens van de diëtist de maatstaf en kun je toch verschillende bronnen optellen.

Reken nooit uit je hoofd. Gebruik altijd het script, zodat de uitkomst elke keer hetzelfde is:

```
python3 scripts/bereken.py --item <product>:<gram> [--item ...] [--zoek <product>] [--aandeel 0.6] [--gewicht <gram>] [--stukken <n>]
```

Producten in het script: `pasta_droog`, `pasta_gekookt`, `volkoren_rijst_droog`, `volkoren_rijst_gekookt`, `japanse_rijst_droog`, `japanse_rijst_gekookt`, `couscous_droog`, `couscous_gekookt`, `soba_droog`, `ramen_droog`, `udon_droog`, `udon_voorgekookt`, `noedels_gekookt`, `bladerdeeg`, `aardappel_rauw`, `aardappel_gekookt`, `zoete_aardappel_rauw`, `zoete_aardappel_gekookt`, `volkoren_wrap`.

Een ander product, of een etiket met een andere waarde: `--item naam:gram:kh_per_100g`. Noemt Wessel een etiketwaarde, gebruik die dan in plaats van de standaard.

## Werkwijze

1. **Ingrediënten verzamelen.** Uit gesproken tekst, een recept-link of een foto van een kookboek. Haal alleen de koolhydraatbronnen eruit met hun gewicht. Ei, kaas, room, groente, vlees en vis tellen niet mee. Rekent het recept voor meer personen dan Wessel kookt, schaal dan eerst naar zijn aantal. Zet stuks om naar gram: 1 vel bladerdeeg = 47 g (vaste waarde van Wessel; ±17 g koolhydraten per vel), kleine volkoren wrap ≈ 40 g, grote ≈ 70 g, middelgrote aardappel ≈ 150 g.
2. **Ontbreekt er iets wezenlijks** (gewicht van een koolhydraatbron, of bij Vraag 1 welk product hij wil bijvullen), stel dan één korte vraag. Ontbreekt alleen iets kleins, neem een redelijke aanname en noem die.
3. **Bepaal de vraag.**
   - *Vraag 1, vooraf:* "hoeveel X kan ik toevoegen" → gebruik `--zoek X` met de vaste bronnen als `--item`.
   - *Vraag 2, achteraf:* "hoeveel mag ik ervan nemen" → alle bronnen als `--item`, plus `--stukken`, `--vorm` en `--plaatje`. Weet je niet in hoeveel stukken hij snijdt, neem dan 8 bij een bakplaat (`rechthoek`) en 8 bij een ronde taartvorm (`rond`), en zeg dat hij het antwoord kan laten aanpassen als hij anders snijdt. Een quiche op een bakplaat is `rechthoek`, in een taart- of quichevorm `rond`.

     **Weegschaal.** Wessel kan het makkelijkst afwegen: bord op de weegschaal, op 0 zetten, opscheppen tot het getal. Geef daarom bij Vraag 2 altijd ook dat getal, met `--gewicht`. Heeft hij het gebakken gerecht gewogen, gebruik dat gewicht (zonder schaal: weeg schaal met quiche, trek het lege gewicht van de schaal af; doe die aftreksom zelf). Heeft hij niet gewogen, schat het gewicht: tel alle rauwe ingrediënten op (ook ei, room, kaas, groente; 1 ei zonder schaal ≈ 50 g) en haal er 10% af voor vocht dat verdampt bij het bakken. Noem dan in "Aanname" dat het een schatting is en dat wegen na het bakken het precies maakt.

     **Vaste ovenschaal.** Wessel en zijn vriendin bakken hun quiche voor twee meestal in een rechthoekige ovenschaal van 28 × 15 × 5,5 cm (Dille & Kamille, wit porselein). Zegt hij "ovenschaal 28", "onze ovenschaal", "de witte ovenschaal" of noemt hij geen vorm bij een quiche of ovenschotel, gebruik dan `--schaal ovenschaal28`. Het plaatje krijgt dan de echte verhouding van de schaal en zegt hoe groot elk stuk is (bij 8 stukken ±7 × 7,5 cm), zodat hij weet waar hij moet snijden. Standaard 8 stukken; geef `--stukken` mee als hij anders snijdt. Weet hij het gewicht van het hele gerecht, voeg dan ook `--gewicht` toe.
   - Vaak wil hij beide. Doe dan beide.
4. **Draai het script** en neem de getallen over. Rond af zoals het script doet. Bij Vraag 2 maakt het script met `--plaatje stukken.svg --naam "<gerecht>"` een plaatje: bovenaan "Neem X van de N stukken", daaronder de bakvorm met zijn stukken groen en genummerd 1, 2, 3. Laat dat plaatje altijd zien, als afbeelding of als SVG-artifact, bovenaan je antwoord. Het script kiest het aantal hele stukken dat binnen zijn grens valt; geef nooit halve stukken als hoofdadvies.
5. **Antwoord in dit format:**

```
[plaatje van de bakvorm, bij Vraag 2]

🍽️ [gerecht]
✅ Neem [Z] stukken.            ← Vraag 2, het belangrijkste getal
⚖️ Of weeg af: schep tot [G] g op je bord.
➕ Doe er hoogstens [X] g [product] bij.   ← Vraag 1

Jouw deel: [n] portiegram · grens 75–100 ✓/✗
Rekensom: [bron 1] [g] = [pg] · [bron 2] [g] = [pg] · totaal [pg]
Aanname: [alleen als je iets hebt aangenomen, bijv. kh-waarde van bladerdeeg; zeg: check het etiket]
```

Laat Vraag 1 of Vraag 2 weg als die niet gesteld is. Zit hij boven de grens, zeg dan concreet hoe het past, bijvoorbeeld "gebruik 3 vellen bladerdeeg in plaats van 4" of "neem 5 in plaats van 6 stukken". Zit hij onder de 75, zeg hoeveel er nog bij kan.

## Losse koolhydraten

Eet Wessel pasta of aardappel los naast de rest, dan weegt hij zijn eigen portie zelf af. Je hoeft dan niet te rekenen met 60%. Geef gewoon zijn grens in gram van dat product (bijvoorbeeld aardappel: 75–100 portiegram ≈ 350–465 g gekookte aardappel; draai het script met `--aandeel 1` en `--zoek`).

## Waarden zijn schattingen

De koolhydraatwaarden in het script zijn gemiddelden van Nederlandse etiketten. Noem in "Aanname" welke schatting het zwaarst meetelt, zodat Wessel het etiket kan checken. Dit is geen medisch advies; bij twijfel geldt wat de diëtist zegt.
