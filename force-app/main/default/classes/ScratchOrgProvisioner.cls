public with sharing class ScratchOrgProvisioner {
    private static final String BASE_URL = 'https://hosted-scratch.herokuapp.com/launch?template=https://github.com/SFDC-Assets/platformTrial/tree/jan26-trial-experience';

    /**
     * Triggers scratch org provisioning for the given email (server-side callout).
     * Returns 'OK' on success (2xx or 302/redirect = request accepted, credentials emailed).
     */
    @AuraEnabled
    public static String requestProvisioning(String userEmail) {
        String endpoint = BASE_URL;
        if (String.isNotBlank(userEmail)) {
            endpoint += '&email=' + EncodingUtil.urlEncode(userEmail.trim(), 'UTF-8');
        }
        Http http = new Http();
        try {
            HttpResponse res = http.send(buildRequest(endpoint));
            Integer statusCode = res.getStatusCode();
            if (statusCode >= 200 && statusCode < 300) {
                return 'OK';
            }
            if (statusCode == 301 || statusCode == 302 || statusCode == 303 || statusCode == 307) {
                return 'OK';
            }
            return 'Provisioner returned ' + statusCode + '. You can still receive credentials if the request was accepted.';
        } catch (Exception e) {
            System.debug(LoggingLevel.WARN, 'ScratchOrgProvisioner: ' + e.getMessage());
            return 'Could not reach provisioner: ' + e.getMessage();
        }
    }

    private static HttpRequest buildRequest(String endpoint) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('GET');
        req.setTimeout(15000);
        return req;
    }
}