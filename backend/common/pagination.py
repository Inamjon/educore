from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class EnvelopePageNumberPagination(PageNumberPagination):
    """Nests results/pagination under `data`, keeping list responses inside
    the same single envelope shape as everything else, instead of DRF's
    default top-level {count, next, previous, results}.
    """

    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(
            {
                "success": True,
                "message": "",
                "data": {
                    "results": data,
                    "pagination": {
                        "count": self.page.paginator.count,
                        "page": self.page.number,
                        "pages": self.page.paginator.num_pages,
                        "page_size": self.get_page_size(self.request),
                        "next": self.get_next_link(),
                        "previous": self.get_previous_link(),
                    },
                },
            }
        )
