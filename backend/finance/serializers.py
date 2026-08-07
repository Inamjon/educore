from decimal import Decimal

from rest_framework import serializers

from finance.models import Invoice, Payment
from finance.numbering import generate_invoice_number
from finance.services import invoice_paid_amount


class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student_profile.user.get_full_name", read_only=True)
    student_login_id = serializers.CharField(source="student_profile.user.login_id", read_only=True)
    group_name = serializers.CharField(source="group.name", read_only=True, default=None)
    paid_amount = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id", "organization", "student_profile", "student_name", "student_login_id", "group", "group_name",
            "invoice_number", "status", "total_amount", "paid_amount", "balance", "currency", "issued_date",
            "due_date", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "invoice_number", "status", "issued_date", "created_at", "updated_at"]

    def get_paid_amount(self, obj) -> Decimal:
        return invoice_paid_amount(obj)

    def get_balance(self, obj) -> Decimal:
        return obj.total_amount - self.get_paid_amount(obj)

    def create(self, validated_data):
        validated_data["invoice_number"] = generate_invoice_number(Invoice, validated_data["organization"])
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            validated_data["created_by"] = request.user.id
        return super().create(validated_data)


class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student_profile.user.get_full_name", read_only=True)
    invoice_number = serializers.CharField(source="invoice.invoice_number", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id", "organization", "invoice", "invoice_number", "student_profile", "student_name", "amount",
            "currency", "payment_method", "payment_date", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "student_profile", "payment_date", "created_at", "updated_at"]

    def validate(self, attrs):
        invoice = attrs.get("invoice") or getattr(self.instance, "invoice", None)
        if invoice is not None:
            attrs["student_profile"] = invoice.student_profile
            if not self.instance:
                remaining = invoice.total_amount - invoice_paid_amount(invoice)
                if attrs["amount"] > remaining:
                    raise serializers.ValidationError(
                        {"amount": f"Amount exceeds the remaining balance ({remaining} {invoice.currency})."}
                    )
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            validated_data["created_by"] = request.user.id
        return super().create(validated_data)
