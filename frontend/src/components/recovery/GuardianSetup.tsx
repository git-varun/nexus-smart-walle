// frontend/src/components/recovery/GuardianSetup.tsx
import React, { useState } from 'react';
import { isAddress } from 'viem';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface GuardianSetupProps {
  config: any;
  onSetup: (guardians: string[], threshold: number, delay: number) => Promise<void>;
  isLoading: boolean;
}

export const GuardianSetup: React.FC<GuardianSetupProps> = ({ config, onSetup, isLoading }) => {
  const [guardians, setGuardians] = useState<string[]>(['']);
  const [threshold, setThreshold] = useState('2');
  const [delay, setDelay] = useState('48'); // hours
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addGuardianField = () => {
    if (guardians.length < 10) {
      setGuardians([...guardians, '']);
    }
  };

  const removeGuardianField = (index: number) => {
    if (guardians.length > 1) {
      setGuardians(guardians.filter((_, i) => i !== index));
    }
  };

  const updateGuardian = (index: number, address: string) => {
    const newGuardians = [...guardians];
    newGuardians[index] = address;
    setGuardians(newGuardians);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate guardians
    const validGuardians = guardians.filter(g => g && isAddress(g));
    if (validGuardians.length === 0) {
      newErrors.guardians = 'At least one valid guardian address required';
    }

    const uniqueGuardians = [...new Set(validGuardians)];
    if (uniqueGuardians.length !== validGuardians.length) {
      newErrors.guardians = 'Duplicate guardian addresses not allowed';
    }

    // Validate threshold
    const thresholdNum = parseInt(threshold);
    if (thresholdNum < 1 || thresholdNum > validGuardians.length) {
      newErrors.threshold = `Threshold must be between 1 and ${validGuardians.length}`;
    }

    // Validate delay
    const delayNum = parseInt(delay);
    if (delayNum < 1 || delayNum > 720) { // 1 hour to 30 days
      newErrors.delay = 'Delay must be between 1 and 720 hours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const validGuardians = guardians.filter(g => g && isAddress(g));
      const delaySeconds = parseInt(delay) * 3600; // Convert hours to seconds

      await onSetup(validGuardians, parseInt(threshold), delaySeconds);

      // Reset form on success
      setGuardians(['']);
      setThreshold('2');
      setDelay('48');
    } catch (error) {
      console.error('Failed to setup recovery:', error);
    }
  };

  return (
    <div className="space-y-6">
      {config ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <h3 className="text-green-400 font-medium mb-2">✅ Recovery Already Configured</h3>
          <p className="text-sm text-slate-300">
            You have {config.guardians.length} guardians with a threshold of {config.threshold}.
            Recovery delay is set to {config.delay / 3600} hours.
          </p>
        </div>
      ) : (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h3 className="text-blue-400 font-medium mb-2">What is Account Recovery?</h3>
          <p className="text-sm text-slate-300">
            Set up trusted guardians who can help you recover your account if you lose access.
            A threshold number of guardians must approve any recovery attempt.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Guardian Addresses
          </label>
          <div className="space-y-2">
            {guardians.map((guardian, index) => (
              <div key={index} className="flex space-x-2">
                <Input
                  placeholder="0x..."
                  value={guardian}
                  onChange={(e) => updateGuardian(index, e.target.value)}
                  className="flex-1"
                />
                {guardians.length > 1 && (
                  <Button
                    onClick={() => removeGuardianField(index)}
                    variant="outline"
                    size="sm"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              onClick={addGuardianField}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={guardians.length >= 10}
            >
              Add Guardian
            </Button>
          </div>
          {errors.guardians && (
            <p className="text-red-400 text-sm mt-1">{errors.guardians}</p>
          )}
          <p className="text-xs text-slate-500 mt-2">
            Add trusted addresses that can approve recovery. Maximum 10 guardians.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Threshold"
            type="number"
            placeholder="2"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            error={errors.threshold}
            helperText="Number of guardians needed to approve recovery"
          />

          <Input
            label="Recovery Delay (hours)"
            type="number"
            placeholder="48"
            value={delay}
            onChange={(e) => setDelay(e.target.value)}
            error={errors.delay}
            helperText="Time delay before recovery can be executed"
          />
        </div>

        <Button
          onClick={handleSubmit}
          loading={isLoading}
          variant="primary"
          className="w-full"
          disabled={!!config}
        >
          {config ? 'Recovery Already Set Up' : 'Setup Recovery'}
        </Button>
      </div>
    </div>
  );
};