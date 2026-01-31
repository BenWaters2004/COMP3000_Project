<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OsintResult extends Model
{
    protected $fillable = ['scan_request_id', 'module', 'type', 'data', 'date_found', 'corroboration', 'score'];

    public function scanRequest()
    {
        return $this->belongsTo(ScanRequest::class);
    }
}