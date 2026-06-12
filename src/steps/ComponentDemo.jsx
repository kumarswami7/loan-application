import { useState } from 'react';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import RadioGroup from '../components/common/RadioGroup';
import Checkbox from '../components/common/Checkbox';
import CurrencyInput from '../components/common/CurrencyInput';
import MaskedInput from '../components/common/MaskedInput';

/**
 * Temporary visual sandbox for Phase 2 components.
 * Not part of the final wizard - remove before final submission,
 * or keep as a Storybook-style reference page.
 */
export default function ComponentDemo() {
  const [loanType, setLoanType] = useState('Personal');
  const [amount, setAmount] = useState('1050000');
  const [pan, setPan] = useState('ABCPE1234F');
  const [agree, setAgree] = useState(false);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold text-primary">Component Library Demo</h1>

      <Input label="Full Name (as per PAN)" id="fullName" placeholder="e.g. Ravi Kumar" required />

      <Input
        label="Email"
        id="email"
        type="email"
        autoComplete="email"
        error="Please enter a valid email address"
        required
      />

      <Select
        label="Loan Purpose"
        id="loanPurpose"
        placeholder="Select purpose"
        options={['Home Renovation', 'Medical Emergency', 'Wedding', 'Travel', 'Other']}
      />

      <RadioGroup
        label="Loan Type"
        name="loanType"
        value={loanType}
        onChange={(e) => setLoanType(e.target.value)}
        options={['Personal', 'Home', 'Business']}
        required
      />

      <CurrencyInput
        label="Loan Amount"
        id="loanAmount"
        name="loanAmount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        helpText="Enter amount in Indian Rupees"
        required
      />

      <MaskedInput
        label="PAN Number"
        id="pan"
        value={pan}
        onChange={(e) => setPan(e.target.value.toUpperCase())}
        maxLength={10}
        verified
        helpText="Format: AAAAA9999A"
        required
      />

      <Checkbox
        id="agree"
        label="I confirm all information provided is accurate to the best of my knowledge."
        checked={agree}
        onChange={(e) => setAgree(e.target.checked)}
        required
      />

      <pre className="text-xs bg-gray-100 p-3 rounded">
        {JSON.stringify({ loanType, amount, pan, agree }, null, 2)}
      </pre>
    </div>
  );
}
