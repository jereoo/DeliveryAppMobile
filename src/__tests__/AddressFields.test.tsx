import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AddressFields, emptyAddressFields } from '../components/AddressFields';

describe('AddressFields', () => {
  it('renders address inputs and calls onChange for street', () => {
    const onChange = jest.fn();
    const value = emptyAddressFields();
    const { getByPlaceholderText } = render(
      <AddressFields value={value} onChange={onChange} />,
    );
    fireEvent.changeText(getByPlaceholderText('Street Address'), '123 Main St');
    expect(onChange).toHaveBeenCalledWith({ ...value, address_street: '123 Main St' });
  });

  it('emptyAddressFields defaults to US', () => {
    expect(emptyAddressFields().address_country).toBe('US');
  });
});
