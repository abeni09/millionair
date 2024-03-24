import asyncio
import openpyxl
import matplotlib.pyplot as plt

async def calculate_days():
    total_people = 100000
    non_winners = 100000
    winners = 0
    looped_deposited_winners = 0
    looped_deposited_non_winners = 0
    initial_contribution = 50
    initial_prize = 1000000
    increased_contribution = 550
    max_days = 10000

    finished_winners = 0
    net_amount = 0
    total_contribution = 0
    days = 0

    deposits_per_person = [0] * total_people

    # Create a new workbook and add a worksheet
    workbook = openpyxl.Workbook()
    worksheet = workbook.active

    # Set up the header row
    worksheet.append([
        'Day',
        'Total Winners',
        'Non-Winners',
        'Winners Daily Deposit',
        'Non-Winners Daily Deposit',
        'Total Contribution',
        'Daily Payout',
        'Daily Winners',
        'Net Amount',
    ])

    async def write_next_row():
        nonlocal total_people, non_winners, winners, looped_deposited_winners, looped_deposited_non_winners, finished_winners, net_amount, total_contribution, days

        # Check if simulation is complete
        while total_people > 0:
            total_deposited_winners = winners * increased_contribution

            if days > max_days:
                non_winners = 0

            total_deposited_non_winners = non_winners * initial_contribution
            total_contribution = total_deposited_non_winners + total_deposited_winners + net_amount

            # Calculate counts and amounts
            daily_payout = (total_contribution // initial_prize) * initial_prize
            print(f"Day {days}: {finished_winners}")
            net_amount = total_contribution - daily_payout

            # Update deposits for each person
            for index in range(len(deposits_per_person)):
                # if days == 0:
                #     # On the first day, everyone deposits initial_contribution
                #     deposits_per_person[index] += initial_contribution
                #     looped_deposited_non_winners += deposits_per_person[index]
                # elif index < winners:
                #     # From the second day onwards, only winners deposit increased_contribution
                #     remaining_to_prize = initial_prize - deposits_per_person[index]
                #     if remaining_to_prize > 0:
                #         deposit_to_add = min(remaining_to_prize, increased_contribution)
                #         deposits_per_person[index] += deposit_to_add
                #         looped_deposited_winners += deposits_per_person[index]

                #     # If the total deposit reaches initial_prize, remove that person from the list
                #     if deposits_per_person[index] >= initial_prize:
                #         winners -= 1
                #         deposits_per_person.pop(index)
                #         finished_winners += 1

                # else:
                #     if days < max_days:
                #         # Non-winners continue depositing initial_contribution
                #         deposits_per_person[index] += initial_contribution
                #         looped_deposited_non_winners += deposits_per_person[index]
                if index < len(deposits_per_person):
                    # Update deposits for each person
                    if days == 0:
                        # On the first day, everyone deposits initial_contribution
                        deposits_per_person[index] += initial_contribution
                        looped_deposited_non_winners += deposits_per_person[index]
                    elif index < winners:
                        # From the second day onwards, only winners deposit increased_contribution
                        remaining_to_prize = initial_prize - deposits_per_person[index]
                        if remaining_to_prize > 0:
                            deposit_to_add = min(remaining_to_prize, increased_contribution)
                            deposits_per_person[index] += deposit_to_add
                            looped_deposited_winners += deposits_per_person[index]

                        # If the total deposit reaches initial_prize, remove that person from the list
                        if deposits_per_person[index] >= initial_prize:
                            winners -= 1
                            deposits_per_person.pop(index)
                            finished_winners += 1
                else:
                    print("Index out of range")

            # Increment the number of days
            days += 1

            # Add a new row to the worksheet
            worksheet.append([
                days,
                winners,
                total_people,
                total_deposited_winners,
                total_deposited_non_winners,
                total_contribution,
                daily_payout,
                daily_payout / initial_prize,
                net_amount
            ])

            # Plotting the data
            # plt.plot(worksheet['A'][1:], worksheet['E'][1:], label=f'Day {days}')
            
            total_people -= total_contribution // initial_prize
            non_winners -= total_contribution // initial_prize
            winners += total_contribution // initial_prize

            # Update the total contribution for the next day
            if total_people <= 0:
                # Save the workbook to a file once the simulation is complete
                workbook.save('lotto_simulation_results.xlsx')
                print('Excel file generated successfully.')
                
                # Plotting the data
                plt.plot([cell.value for cell in worksheet['A'][1:]], [cell.value for cell in worksheet['E'][1:]], label=f'Day {days}')

                # Show the plot
                plt.xlabel('Day')
                plt.ylabel('Total Non-Winners Deposit')
                plt.title('Lotto Simulation Results')
                plt.legend()
                plt.show()

                return False

            return True  # Indicate that there are more rows to write

    # Start writing rows
    while await write_next_row():
        # Wait for a moment to yield to the event loop
        await asyncio.sleep(0)

    return days

# Run the event loop
asyncio.run(calculate_days())
