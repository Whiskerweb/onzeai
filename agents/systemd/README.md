# systemd timers Onze.ai agents

Timers + services pour faire tourner les pipelines `ingest` / `analyze` /
`compute-clv` en autonome sur la VM GCP `bot.akyra.io`.

## Topologie

```
9 timers .timer          → activent un service template
1 service template @.service (paramétré par instance)
1 helper run.sh          → routes l'instance vers le bon job tsx
```

## Cadences

| Sport | Ingest | Analyze | Justification |
|---|---|---|---|
| **foot** | toutes 4h, :05 | toutes 4h, :35 | matchs distribués J/J, fenêtre 48h |
| **basket** | NBA-aware (06/12/18/21/23/23:30 UTC) | post-ingest +25min | dense pre-tipoff NBA ET soir |
| **tennis** | toutes 4h, :00 | toutes 4h, :30 | volume haut ATP+WTA |
| **UFC** | Mon-Fri 12:00 UTC + samedi 4h | post-ingest +30min | event-day = samedi typique |
| **compute-clv** | daily 02:00 UTC | — | post-fixtures finished J-1 |

## Install sur VM `onze-bot`

```bash
# SSH
gcloud compute ssh onze-bot --zone=europe-west9-a

# Sur la VM, après git pull frais des agents/
cd /opt/onze-agents
chmod +x systemd/run.sh

# Copier units
sudo cp systemd/onze-agents@.service /etc/systemd/system/
sudo cp systemd/onze-agents-*.timer /etc/systemd/system/

# Reload
sudo systemctl daemon-reload

# Enable + démarrer les 9 timers
for t in ingest-foot analyze-foot \
         ingest-basket analyze-basket \
         ingest-tennis analyze-tennis \
         ingest-ufc analyze-ufc \
         compute-clv ; do
  sudo systemctl enable --now "onze-agents-$t.timer"
done

# Vérifier
sudo systemctl list-timers 'onze-agents-*'
```

## Logs

```bash
# Tail tous les logs des services agents
sudo journalctl -u 'onze-agents@*' -f

# Logs d'un sport en particulier
sudo journalctl -u 'onze-agents@analyze-foot.service' -n 100 --no-pager
```

## Désactiver un sport (kill-switch)

Si un coach part en suspension :
```bash
sudo systemctl disable --now onze-agents-analyze-foot.timer
# ingest reste actif (data DB continue à se remplir)
```

Réactiver :
```bash
sudo systemctl enable --now onze-agents-analyze-foot.timer
```

## DRY_RUN shadow

Pour faire tourner les pipelines en mode shadow (insère analyses mais ne push
pas via /api/picks) :

```bash
# Édite /opt/onze-agents/.env
echo "DRY_RUN=1" | sudo tee -a /opt/onze-agents/.env
```

Au prochain firing du timer, le pipeline INSERT analyses avec `dry_run=true`
mais skip le `pushPick`. Pour repasser en prod : enlever la ligne, restart
service.

## Permissions

Le service tourne avec `User=lucasroncey`. Les units `.timer` se déclenchent
en tant que root (système) puis lance le service en user. Pas de privilege
escalation requis.
