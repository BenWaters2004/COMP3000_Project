<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganisationSetting extends Model
{
    protected $table = 'organisation_settings';

    protected $fillable = [
        'organisation_id',
        'simulation_frequency',
        'timezone',
        'start_at',
    ];
}
