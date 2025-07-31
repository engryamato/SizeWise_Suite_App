import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusBar } from '../StatusBar';

/** Minimal props for StatusBar */
const baseProps = {
  isOnline: true,
  isConnectedToServer: true,
  saveStatus: 'saved' as const,
  gridEnabled: true,
  snapEnabled: true,
  zoomLevel: 1,
  onGridToggle: jest.fn(),
  onSnapToggle: jest.fn(),
  onZoomIn: jest.fn(),
  onZoomOut: jest.fn(),
  onZoomReset: jest.fn(),
  summaryOpen: false,
  onSummaryToggle: jest.fn(),
};

describe('StatusBar Summary Button', () => {
  test('renders Summary toggle and fires callback', () => {
    render(<StatusBar {...baseProps} />);
    const summaryButton = screen.getByRole('button', { name: /summary/i });
    expect(summaryButton).toBeInTheDocument();
    fireEvent.click(summaryButton);
    expect(baseProps.onSummaryToggle).toHaveBeenCalled();
  });
});
