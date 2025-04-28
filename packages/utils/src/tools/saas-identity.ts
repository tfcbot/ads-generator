import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ValidUser, ValidUserSchema, ISaasIdentityVendingMachine } from '@metadata/saas-identity.schema';
import { ClerkService, IJwtService } from '@utils/vendors/jwt-vendor';
import { DecodedJwtSchema } from '@metadata/jwt.schema';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { JwtPayload } from '@clerk/types';

class SaaSIdentityErrors extends Error {
    constructor(message: string, public originalError: unknown) {
        super(message);
        this.name = 'SaaSIdentityErrors';
    }
}

export class SaaSIdentityVendingMachine implements ISaasIdentityVendingMachine {
    private jwtService: IJwtService;
    private dbClient: DynamoDBClient;

    constructor() {
        this.dbClient = new DynamoDBClient({});
        this.jwtService = new ClerkService();
    }

    async decodeJwt(token: string): Promise<JwtPayload> {
        const decodedToken = await this.jwtService.decodeToken(token);
        return decodedToken;
    }

    async getValidUserFromAuthHeader(event: APIGatewayProxyEventV2): Promise<ValidUser | null> {
        try {
            const token = event.headers['authorization']?.split(' ')[1] || '';
            const decodedJwt = await this.decodeJwt(token);
           
            const parsedJwt = DecodedJwtSchema.parse(decodedJwt);
            const userDetails: ValidUser = {
                userId: parsedJwt.sub,
                keyId: parsedJwt.metadata?.keyId,
            };
            const isValidUserDetailsAuthHeader = ValidUserSchema.safeParse(userDetails);
            if (isValidUserDetailsAuthHeader.success) {
                return isValidUserDetailsAuthHeader.data;
            }
            return null;
        } catch (error) {
            console.info('User not found in auth header');
            return null;
        }
    }

    async getValidUser(event: APIGatewayProxyEventV2): Promise<ValidUser> {
        try {
            const userDetailsFromAuthHeader = await this.getValidUserFromAuthHeader(event);          
            if (userDetailsFromAuthHeader) {
                console.info('User found in auth header');
                return userDetailsFromAuthHeader;
            }
            throw new Error('Unable to Validate User. Provide a token');
        } catch (error) {
            console.error('Error getting user details:', error);
            throw new Error('Unauthorized');
        }
    }
}

