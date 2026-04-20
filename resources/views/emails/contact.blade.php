@component('mail::message')
# Neue Kontaktanfrage

Es wurde eine neue Kontaktanfrage über das Formular auf der Website eingereicht.

**Name:** {{ $name }}
**Unternehmen:** {{ $company }}
**E-Mail:** {{ $email }}
**Telefon:** {{ $phone }}
**Gewünschte Dienstleistung:** {{ $serviceType }}

**Nachricht:**
{{ $message }}

@component('mail::button', ['url' => config('app.url')])
Zum Dashboard
@endcomponent

Mit freundlichen Grüßen,<br>
{{ config('app.name') }}
@endcomponent
