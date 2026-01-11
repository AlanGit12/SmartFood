# Projektdokumentation – SmartFood

## 1. Einordnung & Zielsetzung

### Kontext & Problem

Im Alltag verlieren viele Haushalte den Überblick über ihre Lebensmittelbestände, was häufig zu unnötigem Verderb und Lebensmittelverschwendung führt. Besonders in Haushalten, in denen mehrere Personen zusammenleben, wird die Übersicht schnell schwierig: Einkäufe werden doppelt getätigt, vorhandene Produkte werden übersehen oder Ablaufdaten nicht beachtet.

Lebensmittel werden zudem an unterschiedlichen Orten gelagert – etwa im Kühlschrank, im Tiefkühler oder im Vorratsschrank. Wenn mehrere Personen einkaufen oder konsumieren, fehlt häufig eine zentrale, aktuelle Übersicht über den tatsächlichen Bestand.

### Zielsetzung

Ziel des Projekts **SmartFood** ist es, eine einfache und alltagstaugliche Lösung zu entwickeln, mit der private Haushalte ihre Lebensmittelbestände strukturiert verwalten können. Der Prototyp soll dabei helfen,

* einen klaren Überblick über vorhandene Lebensmittel und deren Lagerorte zu behalten,
* Ablaufdaten sichtbar zu machen,
* Verbrauch und Entsorgung nachvollziehbar zu dokumentieren,
* Kosten sowie Lebensmittelverschwendung transparent darzustellen.

### Abgrenzung

Das Projekt ist als funktionaler Prototyp konzipiert. Themen wie Benutzerkonten, Mehrbenutzer-Logins, mobile App-Versionen oder externe Supermarkt-Anbindungen sind nicht Teil des Projektumfangs.

---

## 2. Zielgruppe & Stakeholder

### Primäre Zielgruppe

Private Haushalte und Wohngemeinschaften, insbesondere Studierende oder Personen, die gemeinsam einkaufen und Lebensmittel teilen.

### Weitere Stakeholder

Personen mit Interesse an nachhaltigem Konsum und der Reduktion von Lebensmittelverschwendung.

### Annahmen

* Nutzer:innen möchten ihren Lebensmittelbestand mit möglichst geringem Aufwand verwalten.
* Eine visuelle Darstellung (Icons, Statistiken) erleichtert die Nutzung.
* Transparenz über Kosten und Entsorgung erhöht das Bewusstsein für nachhaltigen Konsum.

---

## 3. Anforderungen & Umfang

### Kernfunktionalität

Der Prototyp bildet den vollständigen Lebenszyklus von Lebensmitteln im Haushalt ab – vom Hinzufügen über den Verbrauch bis zur Entsorgung.

1. **Produkte erfassen und verwalten**
   Nutzer:innen können Produkte mit Name, Einheit, Menge, Preis, Lagerort und Ablaufdatum erfassen. Ein Produkt kann aus mehreren Varianten bestehen (z. B. mehrere Packungen mit unterschiedlichen Ablaufdaten).

2. **Lagerorte definieren**
   Lagerorte wie Kühlschrank, Vorratsschrank oder Tiefkühler sind frei verwaltbar und können Produkten zugewiesen werden.

3. **Verbrauch und Entsorgung dokumentieren**
   Verbrauchte Produkte reduzieren den Bestand, entsorgte Produkte werden separat erfasst, um Verschwendung gezielt auszuwerten.

4. **Statistische Auswertung**
   Alle relevanten Aktionen werden protokolliert und in einer Statistikansicht ausgewertet (Ausgaben, Entsorgungen, Mengen).

5. **Produktvorlagen (Templates)**
   Häufig genutzte Produkte können als Vorlagen gespeichert werden, um den Erfassungsprozess zu beschleunigen. Beim Anlegen eines Produkts kann bewusst entschieden werden, ob eine Vorlage erstellt werden soll.

### Akzeptanzkriterien

* Produkte können angelegt, bearbeitet und gelöscht werden.
* Lagerorte sind frei wählbar und korrekt zugeordnet.
* Varianten mit unterschiedlichen Ablaufdaten werden unterstützt.
* Verbrauch und Entsorgung wirken sich korrekt auf Bestand und Statistik aus.
* Zentrale Workflows sind ohne Fehlermeldungen durchführbar.

---

## 4. Vorgehen & Artefakte

### 4.1 Understand & Define

Ausgangspunkt des Projekts war die eigene Erfahrung mit unkoordinierten Einkäufen und fehlender Übersicht in Mehrpersonen-Haushalten. Ziel dieser Phase war es, das Problemfeld klar einzugrenzen und reale Bedürfnisse zu identifizieren.

Die Analyse zeigte, dass besonders eine zentrale Übersicht, geringe Pflegeaufwände und eine realitätsnahe Abbildung von Produkten entscheidend sind.

### 4.2 Sketch

In der Skizzenphase wurden verschiedene Varianten für Inventaransichten, Formularstrukturen und Navigationskonzepte entworfen. Der Fokus lag auf einer klaren Struktur und möglichst wenigen Interaktionen pro Aufgabe.
![Skizzen](image.png)
![Mockup](image-1.png)
### 4.3 Decide

Entschieden wurde sich für eine listenbasierte Inventaransicht mit klarer Trennung zwischen Inventar, Vorlagen, Lagerorten und Statistik. Diese Variante bot den besten Kompromiss aus Übersichtlichkeit und Erweiterbarkeit.
Inspiriert von Bring

### 4.4 Prototype

Der Prototyp wurde mit **SvelteKit** umgesetzt und umfasst alle definierten Kernfunktionen.

#### 4.4.1 Entwurf (Design)

Die Benutzeroberfläche ist bewusst reduziert gehalten. Icons und Farben unterstützen die Orientierung, ohne vom Inhalt abzulenken. Statistiken werden visuell aufbereitet, um Zusammenhänge schnell erfassbar zu machen.

#### 4.4.2 Umsetzung (Technik)

Der Prototyp basiert auf SvelteKit mit serverseitigen Routen und Actions. Die Datenhaltung erfolgt über eine MongoDB, wodurch eine flexible und dokumentenbasierte Speicherung ermöglicht wird.

Die technische Umsetzung ist bewusst umfassend gestaltet, da im realen Haushaltsalltag zahlreiche Sonderfälle auftreten, die korrekt abgebildet werden müssen. Dazu zählen unter anderem:

gleiche Produkte mit unterschiedlichen Ablaufdaten (z. B. mehrere Packungen desselben Artikels),

gleiche Produkte an verschiedenen Lagerorten,

Teil‑Verbrauch von Produkten (z. B. 200 g aus einer 1‑kg‑Packung),

eine klare Trennung zwischen Verbrauch und Entsorgung, um Auswertungen nicht zu verfälschen.

Diese Anforderungen führten zu einer datengetriebenen Modellierung, bei der Produkte aus mehreren Varianten bestehen können und Mengen dynamisch berechnet werden. Aktionen wie Kauf, Verbrauch oder Entsorgung werden nicht nur am Produkt selbst, sondern zusätzlich als Ereignisse gespeichert.

Zentrale Collections in MongoDB sind:

products: Produktstammdaten inklusive Varianten, Mengen, Lagerorten und Ablaufdaten

productTemplates: wiederverwendbare Produktvorlagen

productEvents: Ereignisse wie Kauf, Verbrauch und Entsorgung

storageLocations: frei definierbare Lagerorte

Durch diese Trennung zwischen aktuellem Bestand und Ereignis‑Historie können Statistiken jederzeit konsistent, nachvollziehbar und unabhängig vom aktuellen Zustand des Inventars berechnet werden.

### 4.5 Validate

Die Validierung des Prototyps erfolgte iterativ und praxisnah. Neben eigenen Tests wurden auch externe Personen aus dem privaten Umfeld in die Evaluation einbezogen.

Diese Testpersonen wurden gebeten, typische Alltagssituationen zu schildern, etwa gemeinsames Einkaufen, vergessene Lebensmittel oder angebrochene Packungen, und entsprechende Aufgaben im Prototyp durchzuführen. Ziel war es, Nutzungsszenarien zu identifizieren, an die während der Entwicklung möglicherweise nicht gedacht wurde.

Besonderes Augenmerk lag auf:

der Verständlichkeit der Benutzeroberfläche,

einer logisch nachvollziehbaren Navigation,

der Klarheit von Aktionen wie Verbrauch und Entsorgung,

sowie der allgemeinen Benutzerfreundlichkeit.

Das Feedback bestätigte, dass die Anwendung intuitiv bedienbar ist und zentrale Funktionen ohne zusätzliche Erklärung gefunden werden können. Kleinere Optimierungen wurden direkt in den Prototyp übernommen.

Insgesamt zeigte die Validierung, dass der Prototyp reale Nutzungsszenarien sinnvoll abbildet und die definierten Projektziele erfüllt.
---

## 5. Erweiterungen 

Über den Mindestumfang hinaus wurden zusätzliche Funktionen umgesetzt, darunter die differenzierte Erfassung von Verbrauch und Entsorgung sowie eine Statistikansicht mit mehreren Kennzahlen. Diese Erweiterungen erhöhen den praktischen Nutzen des Prototyps und unterstützen die Zielsetzung der Transparenz.

---

## 6. Projektorganisation [Optional]

Das Projekt wurde als Einzelarbeit umgesetzt. Aufgaben und Probleme wurden iterativ identifiziert und direkt umgesetzt. Die Code-Struktur folgt den Konventionen von SvelteKit und ermöglicht eine klare Trennung von Logik, Darstellung und Datenzugriff.

---

## 7. KI-Deklaration

Im Projektverlauf wurde Künstliche Intelligenz intensiv als unterstützendes Werkzeug eingesetzt. Die Zusammenarbeit mit der KI erfolgte zielgerichtet und dialogbasiert, wobei das Projektziel jederzeit klar definiert war.

Die KI wurde insbesondere genutzt zur:

* Unterstützung bei der Umsetzung und Verbesserung von Code,
* Analyse und Behebung von Fehlern,
* Strukturierung und Überarbeitung von Texten,
* Reflexion von Lösungsansätzen und Designentscheidungen.

Die KI fungierte dabei als Sparringspartner und Unterstützung im Entwicklungsprozess. Konzeption, Architekturentscheidungen und die finale Umsetzung wurden eigenständig vorgenommen. Alle KI-Vorschläge wurden geprüft, angepasst und bewusst integriert.

---


