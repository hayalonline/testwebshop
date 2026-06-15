# n8n smoke test voor Rembro

Deze setup laat n8n reageren op commits naar `main`. Na een push naar `main` voert n8n smoke tests uit totdat de webshop online en bereikbaar is.

## Workflow importeren

Importeer dit bestand in n8n:

```text
n8n/rembro-main-smoketest.workflow.json
```

Activeer daarna de workflow.

## Configuratie

Deze workflow werkt zonder n8n environment variables. De instellingen staan direct in de workflow:

```text
Base URL: http://194.31.150.130:3001
Timeout: 300 seconden
Interval: 10 seconden
```

Wil je later een ander domein of IP gebruiken, open dan de node `Validate main push` en wijzig `baseUrl`.

## GitHub webhook instellen

Ga in GitHub naar:

```text
Repository > Settings > Webhooks > Add webhook
```

Gebruik:

```text
Payload URL: https://JOUW-N8N-DOMEIN/webhook/rembro-main-smoketest
Content type: application/json
Events: Just the push event
Active: aan
```

## Wat wordt getest

De workflow wacht en probeert opnieuw totdat alle checks slagen:

```text
GET /
GET /api/health
GET /api/products
GET /api-docs
```

De smoke test slaagt pas als:

- de homepage `Rembro` bevat
- `/api/health` `ok` bevat
- `/api/products` een seeded product bevat
- `/api-docs` de Swagger UI bevat

## Timing

Standaard probeert n8n maximaal 5 minuten lang elke 10 seconden opnieuw. Dit is bewust gedaan omdat GitHub Actions na een merge eerst de Docker container opnieuw moet bouwen en starten.

## Relatie met GitHub Actions

De bestaande GitHub Actions workflow deployt de app naar de VPS bij push naar `main`.

Deze n8n workflow wordt door dezelfde push getriggerd en blijft controleren totdat de deploy live is. Daardoor heb je in n8n een duidelijke verificatie-run naast de GitHub Actions deploy-run.
