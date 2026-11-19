import { defineConfig } from '@playwright/test';
import { browserConfig } from './tests/support/browser-config';

export default defineConfig(browserConfig('recovery'));
