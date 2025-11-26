export const handler = async (event : any) => {
  console.log("Logout invoked:", JSON.stringify(event));
  
  const S3_WEBSITE_URL =
  "http://soft-enge-static-website-bucket.s3-website-us-east-1.amazonaws.com";

  return {
    statusCode: 302,
    headers: {
      Location: S3_WEBSITE_URL,
    }
  };
};
