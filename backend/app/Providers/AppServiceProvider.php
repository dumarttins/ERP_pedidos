<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Cookie;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Configure session for SPA, different settings for local vs production
        if (app()->environment('local')) {
            // Local environment settings (http://localhost)
            config([
                'session.same_site' => 'lax',
                'session.secure' => false,
                'session.domain' => null
            ]);
        } else {
            // Production settings
            config([
                'session.same_site' => 'none',
                'session.secure' => true
            ]);
        }
    }
}
