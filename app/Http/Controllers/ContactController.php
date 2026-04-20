<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\ContactFormMail;
use App\Http\Requests\ContactFormRequest;
use App\Services\DashboardService;

class ContactController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }


    public function index()
    {
        return inertia('kontakt/index');
    }


    public function submit(ContactFormRequest $request)
    {
        try {
            $response = $this->dashboardService->submitContact($request->validated());

            if (!$response) {
                throw new \Exception('Dashboard API error');
            }

            if (config('dashboard.send_backup_email', true)) {
                Mail::to(config('mail.admin_email', 'info@oi-clean.de'))
                    ->send(new ContactFormMail($request->validated()));
            }

            return back()->with('success', 'Ihre Nachricht wurde erfolgreich gesendet.');
        } catch (\Exception $e) {
            report($e);
            return back()->with('error', 'Es gab einen Fehler beim Senden Ihrer Nachricht. Bitte versuchen Sie es später erneut.');
        }
    }
}
