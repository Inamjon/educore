from rest_framework.renderers import JSONRenderer


class EnvelopeJSONRenderer(JSONRenderer):
    """Wraps raw view data as {"success": true, "message": "", "data": ...}.

    Error responses are already envelope-shaped by the time they reach here
    (common.exceptions.envelope_exception_handler ran first), so this only
    wraps the "no top-level success key yet" case — successful responses.
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if isinstance(data, dict) and "success" in data:
            envelope = data
        else:
            envelope = {"success": True, "message": "", "data": data}
        return super().render(envelope, accepted_media_type, renderer_context)
