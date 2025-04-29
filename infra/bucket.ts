export const adsbucket = new sst.aws.Bucket("AdsBucket", {
    access: "cloudfront",
  })

export const adsBucketRouter = new sst.aws.Router("AdsBucketRouter", {
    routes: {
      "/*": {
        bucket: adsbucket,
        },
    },
  });