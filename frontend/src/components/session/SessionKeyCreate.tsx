// frontend/src/components/session/SessionKeyCreate.tsx
import React, { useState } from 'react';
import { parseEther, isAddress } from 'viem';
import { useSessionKeys } from '../../hooks/useSessionKeys';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface SessionKeyCreateProps {
  onSuccess: () => void;
}

export const SessionKeyCreate: React.FC<SessionKeyCreateProps> = ({ onSuccess }) => {
  const { createSessionKey, isCreating } = useSessionKeys();

  const [formData, setFormData] = useState({
    sessionKey: '',
    spendingLimit: '',
    dailyLimit: '',
    duration: '24', // hours
    allowedTargets: ['']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.sessionKey || !isAddress(formData.sessionKey)) {
      newErrors.sessionKey = 'Valid session key address required';
    }

    if (!formData.spendingLimit || parseFloat(formData.spendingLimit) <= 0) {
      newErrors.spendingLimit = 'Valid spending limit required';
    }

    if (!formData.dailyLimit || parseFloat(formData.dailyLimit) <= 0) {
      newErrors.dailyLimit = 'Valid daily limit required';
    }

    if (parseFloat(formData.dailyLimit) < parseFloat(formData.spendingLimit)) {
      newErrors.dailyLimit = 'Daily limit must be >= spending limit';
    }

    const validTargets = formData.allowedTargets.filter(target =>
      target && isAddress(target)
    );

    if (formData.allowedTargets.some(target => target && !isAddress(target))) {
      newErrors.allowedTargets = 'All target addresses must be valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const validTargets = formData.allowedTargets.filter(target =>
        target && isAddress(target)
      );

      const expiryTime = Math.floor(Date.now() / 1000) + (parseInt(formData.duration) * 3600);

      await createSessionKey({
        sessionKey: formData.sessionKey,
        spendingLimit: parseEther(formData.spendingLimit).toString(),
        dailyLimit: parseEther(formData.dailyLimit).toString(),
        expiryTime,
        allowedTargets: validTargets
      });

      // Reset form
      setFormData({
        sessionKey: '',
        spendingLimit: '',
        dailyLimit: '',
        duration: '24',
        allowedTargets: ['']
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to create session key:', error);
      alert('Failed to create session key. Check console for details.');
    }
  };

  const addTargetField = () => {
    setFormData({
      ...formData,
      allowedTargets: [...formData.allowedTargets, '']
    });
  };

  const removeTargetField = (index: number) => {
    const newTargets = formData.allowedTargets.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      allowedTargets: newTargets.length > 0 ? newTargets : ['']
    });
  };

  const updateTarget = (index: number, value: string) => {
    const newTargets = [...formData.allowedTargets];
    newTargets[index] = value;
    setFormData({
      ...formData,
      allowedTargets: newTargets
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h3 className="text-blue-400 font-medium mb-2">What are Session Keys?</h3>
        <p className="text-sm text-slate-300">
          Session keys allow temporary access to your smart account with limited permissions.
          Perfect for dapps that need multiple transactions without constant wallet approvals.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Session Key Address"
          placeholder="0x..."
          value={formData.sessionKey}
          onChange={(e) => setFormData({ ...formData, sessionKey: e.target.value })}
          error={errors.sessionKey}
          helperText="Address that will have temporary access"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Spending Limit (ETH)"
            placeholder="0.1"
            value={formData.spendingLimit}
            onChange={(e) => setFormData({ ...formData, spendingLimit: e.target.value })}
            error={errors.spendingLimit}
            helperText="Maximum per transaction"
          />

          <Input
            label="Daily Limit (ETH)"
            placeholder="1.0"
            value={formData.dailyLimit}
            onChange={(e) => setFormData({ ...formData, dailyLimit: e.target.value })}
            error={errors.dailyLimit}
            helperText="Maximum per day"
          />
        </div>

        <Input
          label="Duration (hours)"
          type="number"
          placeholder="24"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          helperText="How long the session key will be valid"
        />

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Allowed Target Contracts (Optional)
          </label>
          <div className="space-y-2">
            {formData.allowedTargets.map((target, index) => (
              <div key={index} className="flex space-x-2">
                <Input
                  placeholder="0x... (leave empty to allow all)"
                  value={target}
                  onChange={(e) => updateTarget(index, e.target.value)}
                  className="flex-1"
                />
                {formData.allowedTargets.length > 1 && (
                  <Button
                    onClick={() => removeTargetField(index)}
                    variant="outline"
                    size="sm"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              onClick={addTargetField}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Add Target Contract
            </Button>
          </div>
          {errors.allowedTargets && (
            <p className="text-red-400 text-sm mt-1">{errors.allowedTargets}</p>
          )}
          <p className="text-xs text-slate-500 mt-2">
            Leave empty to allow interaction with any contract
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          loading={isCreating}
          variant="primary"
          className="w-full"
        >
          Create Session Key
        </Button>
      </div>
    </div>
  );
};