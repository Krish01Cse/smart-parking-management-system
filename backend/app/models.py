from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class SlotCreate(BaseModel):
    slot_number: str = Field(..., min_length=2, max_length=20)
    vehicle_type: str = Field(..., pattern="^(Car|Bike)$")
    location_zone: str = Field(..., min_length=2, max_length=50)
    hourly_rate: float = Field(..., gt=0)

class SlotUpdate(BaseModel):
    slot_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    location_zone: Optional[str] = None
    hourly_rate: Optional[float] = None
    status: Optional[str] = None
    current_vehicle: Optional[str] = None

class SlotStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(Available|Occupied|Maintenance)$")
    current_vehicle: Optional[str] = None

class ReservationCreate(BaseModel):
    slot_id: int
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    vehicle_reg_number: str = Field(..., min_length=3, max_length=30)
    vehicle_type: str = Field(..., pattern="^(Car|Bike)$")
    start_time: str
    end_time: str

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=100)
    phone: str = Field(..., min_length=7, max_length=30)
    password: str = Field(..., min_length=6, max_length=100)
    role: str = Field(default="Customer", pattern="^(Administrator|Customer)$")

class UserLogin(BaseModel):
    email: str
    password: str
    required_role: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None

class PaymentCreate(BaseModel):
    reservation_id: int
    payment_method: str = Field(default="Simulated Card")
    simulate_failure: bool = False

class RazorpayOrderCreate(BaseModel):
    reservation_id: int
    currency: Optional[str] = "INR"

class RazorpayPaymentVerify(BaseModel):
    reservation_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    payment_method: Optional[str] = "Razorpay Gateway"


class RazorpayConfigUpdate(BaseModel):
    key_id: str
    key_secret: str

class TestCaseCreate(BaseModel):
    test_case_id: str
    module: str
    test_scenario: str
    test_data: str
    expected_result: str
    actual_result: str
    status: str = "Pending"
    test_type: str = "Functional"

class TestCaseUpdate(BaseModel):
    test_scenario: Optional[str] = None
    test_data: Optional[str] = None
    expected_result: Optional[str] = None
    actual_result: Optional[str] = None
    status: Optional[str] = None

class DefectCreate(BaseModel):
    bug_id: str
    bug_description: str
    steps_to_reproduce: str
    severity: str
    priority: str
    status: str = "Open"
    resolution: Optional[str] = ""
    related_module: str
    retest_result: Optional[str] = ""

class DefectUpdate(BaseModel):
    bug_description: Optional[str] = None
    steps_to_reproduce: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    resolution: Optional[str] = None
    retest_result: Optional[str] = None

class JiraItemUpdate(BaseModel):
    status: str
    title: Optional[str] = None
    description: Optional[str] = None
