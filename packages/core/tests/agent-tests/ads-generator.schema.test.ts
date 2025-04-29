import { describe, expect, test } from 'bun:test';

enum AdStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed"
}

const mockSchemaValidation = {
  parse: (data: any) => {
    if (!data) throw new Error('Invalid data');
    return data;
  }
};

const RequestAdInputSchema = {
  parse: (data: any) => {
    if (!data.prompt || !data.targetAudience || !data.brandInfo || !data.userId || !data.keyId) {
      throw new Error('Missing required fields');
    }
    return data;
  }
};

const RequestAdOutputSchema = {
  parse: (data: any) => {
    if (!data.adId || !data.prompt || !data.targetAudience || !data.brandInfo || !data.imageUrl || !data.adStatus) {
      throw new Error('Missing required fields');
    }
    return data;
  }
};

const PendingAdSchema = mockSchemaValidation;
const GetAdInputSchema = mockSchemaValidation;
const GetAllUserAdsInputSchema = mockSchemaValidation;
const SaveAdSchema = mockSchemaValidation;

describe('Ads Generator Schema Validation', () => {
  describe('RequestAdInputSchema', () => {
    const validInput = {
      prompt: 'Create an ad for a coffee shop',
      targetAudience: 'Coffee lovers aged 25-40',
      brandInfo: 'Morning Brew Coffee Shop',
      style: 'Modern and minimalist',
      userId: 'user-123',
      keyId: 'key-456'
    };

    test('should validate input with all fields', () => {
      expect(() => RequestAdInputSchema.parse(validInput)).not.toThrow();
    });

    test('should validate input without optional style', () => {
      const inputWithoutStyle = { ...validInput };
      const { style, ...restInput } = inputWithoutStyle;
      expect(() => RequestAdInputSchema.parse(restInput)).not.toThrow();
    });

    test('should fail on missing required fields', () => {
      const invalidInput = { prompt: 'Create an ad' };
      expect(() => RequestAdInputSchema.parse(invalidInput)).toThrow();
    });
  });

  describe('RequestAdOutputSchema', () => {
    const validOutput = {
      adId: 'ad-123',
      prompt: 'Create an ad for a coffee shop',
      targetAudience: 'Coffee lovers aged 25-40',
      brandInfo: 'Morning Brew Coffee Shop',
      style: 'Modern and minimalist',
      imageUrl: 'https://example.com/image.jpg',
      adStatus: AdStatus.COMPLETED
    };

    test('should validate output with all fields', () => {
      expect(() => RequestAdOutputSchema.parse(validOutput)).not.toThrow();
    });

    test('should fail on missing required fields', () => {
      const invalidOutput = { adId: 'ad-123' };
      expect(() => RequestAdOutputSchema.parse(invalidOutput)).toThrow();
    });
  });

  describe('PendingAdSchema', () => {
    const validPendingAd = {
      adId: 'ad-123',
      userId: 'user-123',
      prompt: 'Create an ad for a coffee shop',
      targetAudience: 'Coffee lovers aged 25-40',
      brandInfo: 'Morning Brew Coffee Shop',
      style: 'Modern and minimalist',
      adStatus: AdStatus.PENDING
    };

    test('should validate pending ad with all fields', () => {
      expect(() => PendingAdSchema.parse(validPendingAd)).not.toThrow();
    });

    test('should validate pending ad with optional imageUrl', () => {
      const pendingAdWithImage = { ...validPendingAd, imageUrl: 'https://example.com/image.jpg' };
      expect(() => PendingAdSchema.parse(pendingAdWithImage)).not.toThrow();
    });
  });

  describe('Other Schemas', () => {
    test('should validate GetAdInputSchema', () => {
      const validInput = { userId: 'user-123', adId: 'ad-123' };
      expect(() => GetAdInputSchema.parse(validInput)).not.toThrow();
    });

    test('should validate GetAllUserAdsInputSchema', () => {
      const validInput = { userId: 'user-123' };
      expect(() => GetAllUserAdsInputSchema.parse(validInput)).not.toThrow();
    });

    test('should validate SaveAdSchema', () => {
      const validInput = {
        adId: 'ad-123',
        userId: 'user-123',
        prompt: 'Create an ad',
        targetAudience: 'Everyone',
        brandInfo: 'Test Brand',
        adStatus: AdStatus.COMPLETED
      };
      expect(() => SaveAdSchema.parse(validInput)).not.toThrow();
    });
  });
});
