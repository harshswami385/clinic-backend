import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { firebaseAdmin } from './firebase.config';
import { ConfigService } from '@nestjs/config';
// import * as admin from 'firebase-admin'; // Removed unnecessary import, still causes linter error if present

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization token provided');
    }

    const token = authHeader.split(' ')[1]; // Bearer token

    try {
      const decodedToken = await (firebaseAdmin.auth().verifyIdToken as any)(token, {
        audience: [
          this.config.get<string>('FIREBASE_PROJECT_ID'),
          `${this.config.get<string>('FIREBASE_PROJECT_ID')}.appspot.com`,
        ],
        checkRevoked: true,
      });
      
      request.user = decodedToken; // Attach the decoded token to the request
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authorization token');
    }
  }
}