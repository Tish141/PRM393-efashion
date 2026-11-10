import Config from '@/config';
import RequestError from '@server/utils/errors';
import { HttpStatus } from '@server/utils/status';
import busboy from 'busboy';
import { RequestHandler } from 'express';
import { createWriteStream } from 'node:fs';
import path from 'node:path';

const mimeImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function UploadProfilePic(): RequestHandler {
  return (req, _, next) => {
    try {
      const bb = busboy({ headers: req.headers, limits: { fileSize: 5 * 1024 * 1024 } });
      let hasError = false;
      bb.on('error', err => {
        if (hasError) return;
        hasError = true;
        next(err);
      });
      let fileName = '';
      bb.once('file', (name, file, info) => {
        if (!validMimeType(bb, info.mimeType)) {
          file.resume();
          return;
        }
        if (name !== 'profile' && name !== 'image') {
          file.resume();
          bb.emit('error', new RequestError('Accept only profile', HttpStatus.BadRequest));
          return;
        }
        fileName = req.userId + Date.now().toString() + info.filename;
        const stream = createWriteStream(path.join(Config.ProfileImagesDir, fileName));
        file.pipe(stream);
      });

      bb.on('close', () => {
        if (hasError) return;
        if (!fileName) {
          bb.emit('error', new RequestError('profile image required!', HttpStatus.BadRequest));
          return;
        }
        req.file = '/' + fileName;
        next();
      });

      req.pipe(bb);
    } catch (err) {
      if (err.message === 'Missing Content-Type') {
        throw new RequestError(err.message, HttpStatus.BadRequest);
      }
      throw err;
    }
  };
}
export function UploadProductsPics(): RequestHandler {
  return (req, _, next) => {
    const body: { imagesPath: string[] } & Record<string, string | string[]> = {
      imagesPath: [] as string[],
    };
    try {
      if (req.get('Content-type') === 'application/json') {
        next();
        return;
      }
      const bb = busboy({ headers: req.headers, limits: { fileSize: 5 * 1024 * 1024 } });
      let hasError = false;
      bb.on('error', err => {
        if (hasError) return;
        hasError = true;
        next(err);
      });
      bb.on('file', (name, file, info) => {
        if (!validMimeType(bb, info.mimeType)) {
          file.resume();
          return;
        }
        if (name !== 'products') {
          file.resume();
          bb.emit('error', new RequestError('Accept only products'));
          return;
        }
        const fileName = req.userId + Date.now().toString() + info.filename;
        file.on('end', () => {
          body.imagesPath.push(fileName);
        });
        file.on('error', err => next(err));
        const stream = createWriteStream(path.join(Config.ProductImagesDir, fileName));
        file.pipe(stream);
      });

      bb.on('field', (name, value) => {
        body[name] = value;
      });

      bb.on('close', () => {
        if (hasError) return;
        req.body = body;
        next();
      });
      req.pipe(bb);
    } catch (err) {
      if (err.message === 'Missing Content-Type') {
        throw new RequestError(err.message, HttpStatus.BadRequest);
      }
      throw err;
    }
  };
}

export function UploadCategoryPic(): RequestHandler {
  return (req, _, next) => {
    const body: { image: string } & Record<string, string> = { image: '' };
    try {
      if (req.get('Content-type') === 'application/json') {
        next();
        return;
      }
      const bb = busboy({ headers: req.headers, limits: { fileSize: 5 * 1024 * 1024 } });
      let hasError = false;
      bb.on('error', err => {
        if (hasError) return;
        hasError = true;
        next(err);
      });
      bb.once('file', (name, file, info) => {
        if (!validMimeType(bb, info.mimeType)) {
          file.resume();
          return;
        }
        if (name !== 'image') {
          file.resume();
          bb.emit('error', new RequestError('Accept only image'));
          return;
        }
        const fileName = req.userId + Date.now().toString() + info.filename;
        file.on('end', () => {
          body.image = fileName;
        });
        file.on('error', err => next(err));
        const stream = createWriteStream(path.join(Config.CatImagesDir, fileName));
        file.pipe(stream);
      });

      bb.on('field', (name, value) => {
        body[name] = value;
      });

      bb.on('close', () => {
        if (hasError) return;
        req.body = body;
        next();
      });
      req.pipe(bb);
    } catch (err) {
      if (err.message === 'Missing Content-Type') {
        throw new RequestError(err.message, HttpStatus.BadRequest);
      }
      throw err;
    }
  };
}

function validMimeType(bb: busboy.Busboy, mimeType: string): boolean {
  if (!mimeImage.includes(mimeType)) {
    bb.emit('error', new RequestError('Invalid Mime type ' + mimeType, HttpStatus.BadRequest));
    return false;
  }
  return true;
}

declare global {
  namespace Express {
    export interface Request {
      file?: string;
    }
  }
}
