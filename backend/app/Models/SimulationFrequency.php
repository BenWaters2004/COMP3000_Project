<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SimulationFrequency extends Model
{
    protected $fillable = [
        'value',
        'label',
    ];
}