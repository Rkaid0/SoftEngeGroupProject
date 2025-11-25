exports.handler = async function(event: any) {
    console.log('request:', JSON.stringify(event, undefined, 2));

    const email = event.requestContext?.authorizer?.claims?.email;

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: `Hello, ${email}!`,
    };
};
