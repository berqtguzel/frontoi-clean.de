<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactFormMail extends Mailable
{
    use Queueable, SerializesModels;

    public $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function build()
    {
        return $this->markdown('emails.contact')
                    ->subject('Neue Kontaktanfrage von ' . $this->data['name'])
                    ->with([
                        'name' => $this->data['name'],
                        'company' => $this->data['company'] ?? 'Nicht angegeben',
                        'email' => $this->data['email'],
                        'phone' => $this->data['phone'] ?? 'Nicht angegeben',
                        'serviceType' => $this->data['serviceType'] ?? 'Nicht angegeben',
                        'message' => $this->data['message']
                    ]);
    }
}
