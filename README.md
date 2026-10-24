# GimmeHours 0.2

Wtyczka Chrome do użytku prywatnego. Bez klucza API.

## Instalacja i aktualizacja

1. Rozpakuj ZIP.
2. Otwórz chrome://extensions i włącz Tryb programisty.
3. Wybierz Załaduj rozpakowane i wskaż folder z manifest.json.
4. Odśwież YouTube.

Jeśli aktualizujesz wersję 0.1: zastąp pliki w dotychczasowym folderze, kliknij przeładowanie rozszerzenia w chrome://extensions i odśwież kartę YouTube. Nie instaluj dwóch kopii jednocześnie.

## Wygląd

Zwinięty opis zachowuje oryginalny tekst YouTube, np. „17 lat temu”. Po rozwinięciu wtyczka zastępuje istniejącą datę datą z godziną, minutami i sekundami. Zmienia tekst w natywnym elemencie, zachowując jego czcionkę, kolor i grubość. Nie dodaje osobnego wiersza ani etykiety. Najazd na datę pokazuje strefę systemową i czas UTC. Format daty odpowiada językowi strony; czas jest w strefie systemowej.

Jeśli YouTube nie udostępnia dokładnej godziny albo nie udało się znaleźć istniejącego elementu daty, opis pozostaje bez zmian. Ponowienie odczytu: odśwież kartę.

## Dane i prywatność

Odczytuje publishDate z playerMicroformatRenderer; w razie braku pełnego publishDate korzysta z pełnego uploadDate (rozróżnienie w dymku). Odrzuca daty bez czasu i strefy. Najpierw sprawdza dane odtwarzacza, następnie w razie potrzeby pobiera HTML filmu z tego samego YouTube z bieżącą sesją. Nie wysyła danych do innych serwisów. Pamięć do 100 wyników na kartę znika po odświeżeniu. Brak telemetrii, serwera i klucza API.

Działa na www.youtube.com/watch. Shorts i osadzone odtwarzacze nie są obsługiwane. Daty publikacji i przesłania mogą różnić się przy premierach, transmisjach lub filmach wcześniej prywatnych. Skrypt działa w MAIN, aby czytać dane odtwarzacza. Wewnętrzne dane i HTML YouTube mogą się zmienić i wymagać aktualizacji.

## Weryfikacja

Parser sprawdzono na pobranym HTML prawdziwego filmu YouTube. Testy logiki renderowania obejmują rozwinięcie i zwinięcie opisu, przywracanie tekstu, wielokrotny render oraz ponowne użycie elementu przez YouTube. Składnia JavaScript jest poprawna. Nie wykonano testu wersji 0.2 załadowanej w Chrome; selektory mogą wymagać dostosowania do wariantu interfejsu YouTube.
