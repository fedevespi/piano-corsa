Facili
- Contatore progressi nell'header — "12/24 sessioni completate · 50%" con una barra generale, così vedi a colpo d'occhio quanto sei avanti nel piano
- Vibrazione al cambio fase — usare navigator.vibrate() insieme ai beep del cronometro, utile se hai le cuffie ma il telefono in tasca


Medie
- Storico delle sessioni — mostrare quanto tempo hai impiegato a completare ogni sessione (salvato automaticamente quando stoppi il timer), così vedi i tuoi miglioramenti
- Nota rapida per sessione — un campo testo dove scrivi "gambe pesanti" o "ottima sessione", salvato in localStorage
- Dark mode — l'app ha una palette calda che si presta bene, con un toggle manuale o seguendo prefers-color-scheme

Difficili
- Piano personalizzabile — permettere all'utente di modificare i dettagli delle sessioni (es. cambiare "1 min corsa" in "90 sec") prima di generare il piano
- PWA installabile — aggiungere manifest.json e service worker così l'app si installa come app nativa su Android (icona nella home, schermo intero, funziona offline)