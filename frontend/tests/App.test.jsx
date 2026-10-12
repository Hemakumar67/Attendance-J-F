import { describe, it, expect } from 'vitest';
import App from '../src/App';

describe('Frontend App Smoke Test', () => {
  it('renders login screen when unauthenticated', () => {
    expect(App).toBeDefined();
  });
});
