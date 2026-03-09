declare module 'jsrsasign' {
  export namespace KJUR {
    export namespace jws {
      export namespace JWS {
        export function sign(
          alg: string,
          sHeader: string,
          sPayload: string,
          key: string
        ): string;
      }
    }
  }
}
