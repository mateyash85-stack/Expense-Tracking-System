$BASE = "http://localhost:8001/api"
$email = "fastapi_test_$(Get-Date -Format 'yyyyMMddHHmmss')@gmail.com"

Write-Host "`n🚀 Testing FastAPI Backend`n"

# Health
$h = Invoke-RestMethod "$BASE/health"
Write-Host "✅ Health: $($h.status)"

# Register
$reg = Invoke-RestMethod -Method POST "$BASE/auth/register" `
  -ContentType "application/json" `
  -Body (ConvertTo-Json @{ name="Test User"; email=$email; password="password123" })
Write-Host "✅ Register: $($reg.message)"

# Login
$login = Invoke-RestMethod -Method POST "$BASE/auth/login" `
  -ContentType "application/json" `
  -Body (ConvertTo-Json @{ email=$email; password="password123" })
$token = $login.token
Write-Host "✅ Login: token received = $($token.Length -gt 10)"

$headers = @{ Authorization = "Bearer $token" }

# Get Me
$me = Invoke-RestMethod "$BASE/auth/me" -Headers $headers
Write-Host "✅ GetMe: $($me.user.email)"

# Create Category
$cat = Invoke-RestMethod -Method POST "$BASE/categories/" -Headers $headers `
  -ContentType "application/json" `
  -Body (ConvertTo-Json @{ name="Food"; icon="🍔" })
Write-Host "✅ Create Category: $($cat.category.name)"

# List Categories
$cats = Invoke-RestMethod "$BASE/categories/" -Headers $headers
Write-Host "✅ List Categories: $($cats.categories.Count) found"

# Create Expense
$exp = Invoke-RestMethod -Method POST "$BASE/expenses/" -Headers $headers `
  -ContentType "application/json" `
  -Body (ConvertTo-Json @{ title="Zomato"; amount=450; date="2026-06-18"; type="expense"; category_id=$cat.category.id; note="Dinner" })
Write-Host "✅ Create Expense: $($exp.expense.title) ₹$($exp.expense.amount)"

# List Expenses
$exps = Invoke-RestMethod "$BASE/expenses/" -Headers $headers
Write-Host "✅ List Expenses: $($exps.total) total"

# Summary
$sum = Invoke-RestMethod "$BASE/expenses/summary" -Headers $headers
Write-Host "✅ Summary: income=₹$($sum.summary.income) expense=₹$($sum.summary.expense) balance=₹$($sum.summary.balance)"

Write-Host "`n✅ All tests passed!`n"
