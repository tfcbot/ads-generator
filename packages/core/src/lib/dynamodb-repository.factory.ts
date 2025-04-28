/**
 * DynamoDB Repository Factory
 * 
 * This module provides a base repository class for DynamoDB operations that can be
 * extended for specific tables. It implements common CRUD operations and provides
 * a standardized interface for interacting with DynamoDB.
 */

import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  DeleteCommand,
  UpdateCommand,
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand
} from "@aws-sdk/lib-dynamodb";

/**
 * Base interface for all repository entities
 */
export interface BaseEntity {
  id?: string;
  [key: string]: any;
}

/**
 * Configuration options for the base repository
 */
export interface BaseRepositoryOptions {
  /** The name of the DynamoDB table */
  tableName: string;
  
  /** The primary key attribute name (default: 'id') */
  primaryKey?: string;
  
  /** The sort key attribute name (if applicable) */
  sortKey?: string;
  
  /** Whether to include detailed logging (default: false) */
  verbose?: boolean;
  
  /** Custom error messages */
  errorMessages?: {
    notFound?: string;
    saveFailed?: string;
    getFailed?: string;
    queryFailed?: string;
    deleteFailed?: string;
    updateFailed?: string;
  };
}

/**
 * Base repository interface defining common operations
 */
export interface IBaseRepository<T extends BaseEntity> {
  /** Save an entity to the database */
  save(entity: T): Promise<void>;
  
  /** Get an entity by its primary key */
  getById(id: string, sortKeyValue?: string): Promise<T>;
  
  /** Query entities by a key condition */
  query(keyName: string, keyValue: any, options?: QueryOptions): Promise<T[]>;
  
  /** Delete an entity by its primary key */
  delete(id: string, sortKeyValue?: string): Promise<void>;
  
  /** Update specific attributes of an entity */
  update(id: string, attributes: Partial<T>, sortKeyValue?: string): Promise<void>;
  
  /** Scan the entire table with optional filters */
  scan(options?: ScanOptions): Promise<T[]>;
  
  /** Get multiple entities by their primary keys */
  batchGet(ids: string[]): Promise<T[]>;
}

/**
 * Options for query operations
 */
export interface QueryOptions {
  /** Index name to query against */
  indexName?: string;
  
  /** Filter expression to apply */
  filterExpression?: string;
  
  /** Attribute values for the filter expression */
  expressionAttributeValues?: Record<string, any>;
  
  /** Attribute names for the filter expression */
  expressionAttributeNames?: Record<string, string>;
  
  /** Maximum number of items to return */
  limit?: number;
  
  /** Exclusive start key for pagination */
  exclusiveStartKey?: Record<string, any>;
  
  /** Whether to scan forward (default: true) */
  scanForward?: boolean;
}

/**
 * Options for scan operations
 */
export interface ScanOptions {
  /** Filter expression to apply */
  filterExpression?: string;
  
  /** Attribute values for the filter expression */
  expressionAttributeValues?: Record<string, any>;
  
  /** Attribute names for the filter expression */
  expressionAttributeNames?: Record<string, string>;
  
  /** Maximum number of items to return */
  limit?: number;
  
  /** Exclusive start key for pagination */
  exclusiveStartKey?: Record<string, any>;
}

/**
 * Base repository class implementing common DynamoDB operations
 */
export class BaseRepository<T extends BaseEntity> implements IBaseRepository<T> {
  protected tableName: string;
  protected primaryKey: string;
  protected sortKey?: string;
  protected verbose: boolean;
  protected errorMessages: Required<NonNullable<BaseRepositoryOptions['errorMessages']>>;
  
  /**
   * Create a new base repository
   */
  constructor(
    protected dbClient: DynamoDBDocumentClient,
    options: BaseRepositoryOptions
  ) {
    this.tableName = options.tableName;
    this.primaryKey = options.primaryKey || 'id';
    this.sortKey = options.sortKey;
    this.verbose = options.verbose || false;
    
    // Default error messages
    const defaultErrorMessages = {
      notFound: 'Entity not found',
      saveFailed: 'Failed to save entity',
      getFailed: 'Failed to get entity',
      queryFailed: 'Failed to query entities',
      deleteFailed: 'Failed to delete entity',
      updateFailed: 'Failed to update entity'
    };
    
    this.errorMessages = {
      ...defaultErrorMessages,
      ...options.errorMessages
    };
  }
  
  /**
   * Save an entity to the database
   */
  async save(entity: T): Promise<void> {
    if (this.verbose) {
      console.info(`Saving entity to ${this.tableName}`);
    }
    
    try {
      const params = {
        TableName: this.tableName,
        Item: entity
      };
      
      await this.dbClient.send(new PutCommand(params));
    } catch (error: unknown) {
      console.error(`Error saving entity to ${this.tableName}:`, error);
      throw new Error(this.errorMessages.saveFailed);
    }
  }
  
  /**
   * Get an entity by its primary key
   */
  async getById(id: string, sortKeyValue?: string): Promise<T> {
    if (this.verbose) {
      console.info(`Getting entity from ${this.tableName} with ${this.primaryKey}=${id}`);
    }
    
    try {
      const key: Record<string, any> = { [this.primaryKey]: id };
      
      // Add sort key if provided and configured
      if (this.sortKey && sortKeyValue) {
        key[this.sortKey] = sortKeyValue;
      }
      
      const params = {
        TableName: this.tableName,
        Key: key
      };
      
      const result = await this.dbClient.send(new GetCommand(params));
      
      if (!result.Item) {
        throw new Error(this.errorMessages.notFound);
      }
      
      return result.Item as T;
    } catch (error: unknown) {
      console.error(`Error getting entity from ${this.tableName}:`, error);
      
      // Rethrow not found errors with the custom message
      if (error instanceof Error && error.message === this.errorMessages.notFound) {
        throw error;
      }
      
      throw new Error(this.errorMessages.getFailed);
    }
  }
  
  /**
   * Query entities by a key condition
   */
  async query(keyName: string, keyValue: any, options: QueryOptions = {}): Promise<T[]> {
    if (this.verbose) {
      console.info(`Querying ${this.tableName} with ${keyName}=${keyValue}`);
    }
    
    try {
      const params: any = {
        TableName: this.tableName,
        KeyConditionExpression: `${keyName} = :keyValue`,
        ExpressionAttributeValues: {
          ':keyValue': keyValue
        }
      };
      
      // Add optional parameters if provided
      if (options.indexName) {
        params.IndexName = options.indexName;
      }
      
      if (options.filterExpression) {
        params.FilterExpression = options.filterExpression;
      }
      
      if (options.expressionAttributeValues) {
        params.ExpressionAttributeValues = {
          ...params.ExpressionAttributeValues,
          ...options.expressionAttributeValues
        };
      }
      
      if (options.expressionAttributeNames) {
        params.ExpressionAttributeNames = options.expressionAttributeNames;
      }
      
      if (options.limit) {
        params.Limit = options.limit;
      }
      
      if (options.exclusiveStartKey) {
        params.ExclusiveStartKey = options.exclusiveStartKey;
      }
      
      if (options.scanForward !== undefined) {
        params.ScanIndexForward = options.scanForward;
      }
      
      const result = await this.dbClient.send(new QueryCommand(params));
      return (result.Items || []) as T[];
    } catch (error: unknown) {
      console.error(`Error querying ${this.tableName}:`, error);
      throw new Error(this.errorMessages.queryFailed);
    }
  }
  
  /**
   * Delete an entity by its primary key
   */
  async delete(id: string, sortKeyValue?: string): Promise<void> {
    if (this.verbose) {
      console.info(`Deleting entity from ${this.tableName} with ${this.primaryKey}=${id}`);
    }
    
    try {
      const key: Record<string, any> = { [this.primaryKey]: id };
      
      // Add sort key if provided and configured
      if (this.sortKey && sortKeyValue) {
        key[this.sortKey] = sortKeyValue;
      }
      
      const params = {
        TableName: this.tableName,
        Key: key
      };
      
      await this.dbClient.send(new DeleteCommand(params));
    } catch (error: unknown) {
      console.error(`Error deleting entity from ${this.tableName}:`, error);
      throw new Error(this.errorMessages.deleteFailed);
    }
  }
  
  /**
   * Update specific attributes of an entity
   */
  async update(id: string, attributes: Partial<T>, sortKeyValue?: string): Promise<void> {
    if (this.verbose) {
      console.info(`Updating entity in ${this.tableName} with ${this.primaryKey}=${id}`);
    }
    
    try {
      const key: Record<string, any> = { [this.primaryKey]: id };
      
      // Add sort key if provided and configured
      if (this.sortKey && sortKeyValue) {
        key[this.sortKey] = sortKeyValue;
      }
      
      // Build update expression and attribute values
      const updateExpressions: string[] = [];
      const expressionAttributeValues: Record<string, any> = {};
      const expressionAttributeNames: Record<string, string> = {};
      
      Object.entries(attributes).forEach(([attrName, attrValue], index) => {
        // Skip primary key and sort key
        if (attrName === this.primaryKey || attrName === this.sortKey) {
          return;
        }
        
        const placeholder = `:val${index}`;
        const nameKey = `#attr${index}`;
        
        updateExpressions.push(`${nameKey} = ${placeholder}`);
        expressionAttributeValues[placeholder] = attrValue;
        expressionAttributeNames[nameKey] = attrName;
      });
      
      if (updateExpressions.length === 0) {
        // Nothing to update
        return;
      }
      
      const params = {
        TableName: this.tableName,
        Key: key,
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames
      };
      
      await this.dbClient.send(new UpdateCommand(params));
    } catch (error: unknown) {
      console.error(`Error updating entity in ${this.tableName}:`, error);
      throw new Error(this.errorMessages.updateFailed);
    }
  }
  
  /**
   * Scan the entire table with optional filters
   */
  async scan(options: ScanOptions = {}): Promise<T[]> {
    if (this.verbose) {
      console.info(`Scanning ${this.tableName}`);
    }
    
    try {
      const params: any = {
        TableName: this.tableName
      };
      
      // Add optional parameters if provided
      if (options.filterExpression) {
        params.FilterExpression = options.filterExpression;
      }
      
      if (options.expressionAttributeValues) {
        params.ExpressionAttributeValues = options.expressionAttributeValues;
      }
      
      if (options.expressionAttributeNames) {
        params.ExpressionAttributeNames = options.expressionAttributeNames;
      }
      
      if (options.limit) {
        params.Limit = options.limit;
      }
      
      if (options.exclusiveStartKey) {
        params.ExclusiveStartKey = options.exclusiveStartKey;
      }
      
      const result = await this.dbClient.send(new ScanCommand(params));
      return (result.Items || []) as T[];
    } catch (error: unknown) {
      console.error(`Error scanning ${this.tableName}:`, error);
      throw new Error(`Failed to scan ${this.tableName}`);
    }
  }
  
  /**
   * Get multiple entities by their primary keys
   */
  async batchGet(ids: string[]): Promise<T[]> {
    if (this.verbose) {
      console.info(`Batch getting ${ids.length} entities from ${this.tableName}`);
    }
    
    if (ids.length === 0) {
      return [];
    }
    
    try {
      // DynamoDB batch get has a limit of 100 items
      const batchSize = 100;
      const batches = [];
      
      // Split ids into batches of 100
      for (let i = 0; i < ids.length; i += batchSize) {
        batches.push(ids.slice(i, i + batchSize));
      }
      
      const results: T[] = [];
      
      // Process each batch
      for (const batch of batches) {
        const keys = batch.map(id => ({ [this.primaryKey]: id }));
        
        const params = {
          RequestItems: {
            [this.tableName]: {
              Keys: keys
            }
          }
        };
        
        const result = await this.dbClient.send(new BatchGetCommand(params));
        
        if (result.Responses && result.Responses[this.tableName]) {
          results.push(...(result.Responses[this.tableName] as T[]));
        }
      }
      
      return results;
    } catch (error: unknown) {
      console.error(`Error batch getting entities from ${this.tableName}:`, error);
      throw new Error(`Failed to batch get entities from ${this.tableName}`);
    }
  }
}

/**
 * Create a base repository for a specific entity type
 */
export function createBaseRepository<T extends BaseEntity>(
  dbClient: DynamoDBDocumentClient,
  options: BaseRepositoryOptions
): IBaseRepository<T> {
  return new BaseRepository<T>(dbClient, options);
}

/**
 * Example usage:
 * 
 * // Define your entity type
 * interface Deliverable extends BaseEntity {
 *   deliverableId: string;
 *   userId: string;
 *   content: string;
 *   createdAt: string;
 * }
 * 
 * // Create a repository for deliverables
 * const deliverableRepository = createBaseRepository<Deliverable>(dbClient, {
 *   tableName: 'Deliverables',
 *   primaryKey: 'deliverableId',
 *   verbose: true,
 *   errorMessages: {
 *     notFound: 'Deliverable not found',
 *     saveFailed: 'Failed to save deliverable'
 *   }
 * });
 * 
 * // Or extend the base repository for custom functionality
 * class DeliverableRepository extends BaseRepository<Deliverable> {
 *   constructor(dbClient: DynamoDBDocumentClient) {
 *     super(dbClient, {
 *       tableName: 'Deliverables',
 *       primaryKey: 'deliverableId'
 *     });
 *   }
 * 
 *   // Add custom methods
 *   async getByUserId(userId: string): Promise<Deliverable[]> {
 *     return this.query('userId', userId, {
 *       indexName: 'UserIdIndex'
 *     });
 *   }
 * }
 */
