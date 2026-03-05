<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Timezone extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'group_name',
        'order',
    ];
}