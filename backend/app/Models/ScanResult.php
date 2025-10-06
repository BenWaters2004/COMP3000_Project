<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class ScanResult extends Model
{
    protected $fillable = [
        'scan_id',
        'consent_id',
        'encrypted_payload',
        'stored_at',
        'summary',
    ];

    protected $casts = [
        'stored_at' => 'datetime',
    ];

    public function consent()
    {
        return $this->belongsTo(Consent::class);
    }

    /**
     * Decrypt the JSON payload. Use with caution and only when the caller is authorised.
     */
    public function getDecryptedPayload(): string
    {
        return Crypt::decryptString($this->encrypted_payload);
    }

    /**
     * Store (encrypt) raw payload safely.
     */
    public static function storeEncrypted(string $scanId, ?int $consentId, string $rawJson, ?string $summary = null): self
    {
        $enc = Crypt::encryptString($rawJson);

        return self::create([
            'scan_id' => $scanId,
            'consent_id' => $consentId,
            'encrypted_payload' => $enc,
            'stored_at' => now(),
            'summary' => $summary,
        ]);
    }
}